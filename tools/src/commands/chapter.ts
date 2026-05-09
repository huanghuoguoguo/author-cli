import { join } from "node:path";
import { existsSync, mkdirSync, unlinkSync, readdirSync, writeFileSync, copyFileSync, readFileSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { PlotSchema, createDefaultChapterOutline } from "../schemas/plot.js";

/**
 * chapter 命令管理章节的物理文件和大纲条目。
 * 新增/删除章节必须通过此命令，不能直接创建或删除 manuscript 文件。
 */
export function registerChapterCommand(program: any) {
  const chapter = program
    .command("chapter")
    .description("管理章节文件和大纲条目");

  // chapter add
  chapter
    .command("add")
    .description("创建新章节（同时创建大纲条目和 manuscript 文件）")
    .requiredOption("--id <id>", "章节 ID (如 ch001)")
    .requiredOption("--title <title>", "章节标题")
    .option("--volume <volume>", "所属分卷", "v01")
    .option("--purpose <purpose>", "章节目的")
    .action((opts: { id: string; title: string; volume: string; purpose?: string }) => {
      const paths = getProjectPaths();

      // 1. 检查大纲中是否已存在
      const plotPath = join(paths.plotDir, "mainline.yaml");
      const raw = readYaml(plotPath);
      if (!raw) {
        console.error("大纲文件不存在: canon/plot/mainline.yaml");
        process.exit(1);
      }
      const plot = PlotSchema.parse(raw);

      if (plot.chapters.some((ch) => ch.id === opts.id)) {
        console.error(`章节已存在于大纲中: ${opts.id}`);
        process.exit(1);
      }

      // 2. 检查 manuscript 文件是否已存在
      const volDir = join(paths.manuscriptDir, opts.volume);
      const chapterFile = join(volDir, `${opts.id}.md`);
      if (existsSync(chapterFile)) {
        console.error(`章节文件已存在: ${chapterFile}`);
        process.exit(1);
      }

      // 3. 创建大纲条目
      const chapterOutline = createDefaultChapterOutline(opts.id, opts.title);
      if (opts.purpose) chapterOutline.purpose = opts.purpose;
      plot.chapters.push(chapterOutline);
      writeYaml(plotPath, plot);

      // 4. 创建 manuscript 文件
      mkdirSync(volDir, { recursive: true });
      writeFileSync(chapterFile, `# ${opts.title}\n\n`, "utf-8");

      console.log(`✓ 章节已创建:`);
      console.log(`  大纲: ${plotPath}`);
      console.log(`  正文: ${chapterFile}`);
    });

  // chapter import（新增）
  chapter
    .command("import")
    .description("导入已有正文文件（创建大纲条目，复制正文）")
    .requiredOption("--id <id>", "章节 ID (如 ch001)")
    .requiredOption("--title <title>", "章节标题")
    .requiredOption("--from <source>", "源文件路径")
    .option("--volume <volume>", "所属分卷", "v01")
    .option("--summary <summary>", "章节摘要")
    .option("--overwrite", "覆盖已存在的目标文件")
    .action((opts: { id: string; title: string; from: string; volume: string; summary?: string; overwrite?: boolean }) => {
      const paths = getProjectPaths();

      // 1. 检查源文件
      if (!existsSync(opts.from)) {
        console.error(`源文件不存在: ${opts.from}`);
        process.exit(1);
      }

      // 2. 检查大纲中是否已存在
      const plotPath = join(paths.plotDir, "mainline.yaml");
      const raw = readYaml(plotPath);
      if (!raw) {
        console.error("大纲文件不存在: canon/plot/mainline.yaml");
        process.exit(1);
      }
      const plot = PlotSchema.parse(raw);

      if (plot.chapters.some((ch) => ch.id === opts.id)) {
        console.error(`章节已存在于大纲中: ${opts.id}`);
        console.log(`  使用 'outline update-chapter' 更新现有条目`);
        process.exit(1);
      }

      // 3. 检查目标文件
      const volDir = join(paths.manuscriptDir, opts.volume);
      const chapterFile = join(volDir, `${opts.id}.md`);
      if (existsSync(chapterFile) && !opts.overwrite) {
        console.error(`目标文件已存在: ${chapterFile}`);
        console.log(`  使用 --overwrite 强制覆盖`);
        process.exit(1);
      }

      // 4. 先复制正文文件（原子操作：文件成功后再写大纲）
      mkdirSync(volDir, { recursive: true });
      try {
        copyFileSync(opts.from, chapterFile);
      } catch (e: any) {
        console.error(`复制文件失败: ${e.message}`);
        process.exit(1);
      }

      // 5. 复制成功后，创建大纲条目（状态为 imported）
      const chapterOutline = createDefaultChapterOutline(opts.id, opts.title);
      chapterOutline.status = "imported";
      if (opts.summary) chapterOutline.summary = opts.summary;
      plot.chapters.push(chapterOutline);
      writeYaml(plotPath, plot);

      console.log(`✓ 章节已导入:`);
      console.log(`  大纲: ${plotPath} (状态: imported)`);
      console.log(`  正文: ${chapterFile}`);
      console.log(`  来源: ${opts.from}`);
    });

  // chapter delete
  chapter
    .command("delete <id>")
    .description("删除章节（同时删除大纲条目和 manuscript 文件）")
    .option("--volume <volume>", "所属分卷", "v01")
    .option("--keep-file", "保留 manuscript 文件，只从大纲中移除")
    .action((id: string, opts: { volume: string; keepFile?: boolean }) => {
      const paths = getProjectPaths();

      // 1. 从大纲中移除
      const plotPath = join(paths.plotDir, "mainline.yaml");
      const raw = readYaml(plotPath);
      if (!raw) {
        console.error("大纲文件不存在");
        process.exit(1);
      }
      const plot = PlotSchema.parse(raw);
      const index = plot.chapters.findIndex((ch) => ch.id === id);

      if (index === -1) {
        console.error(`章节不存在于大纲中: ${id}`);
        process.exit(1);
      }

      plot.chapters.splice(index, 1);
      writeYaml(plotPath, plot);
      console.log(`✓ 已从大纲中移除: ${id}`);

      // 2. 删除 manuscript 文件
      if (!opts.keepFile) {
        const volDir = join(paths.manuscriptDir, opts.volume);
        const chapterFile = join(volDir, `${id}.md`);
        if (existsSync(chapterFile)) {
          unlinkSync(chapterFile);
          console.log(`✓ 已删除文件: ${chapterFile}`);
        } else {
          console.log(`  文件不存在，跳过: ${chapterFile}`);
        }
      }
    });

  // chapter list
  chapter
    .command("list")
    .description("列出所有章节（大纲 + manuscript 文件状态）")
    .action(() => {
      const paths = getProjectPaths();

      // 从大纲读取
      const plotPath = join(paths.plotDir, "mainline.yaml");
      const raw = readYaml(plotPath);
      if (!raw) {
        console.log("大纲文件不存在");
        return;
      }
      const plot = PlotSchema.parse(raw);

      if (plot.chapters.length === 0) {
        console.log("暂无章节");
        return;
      }

      // 扫描 manuscript 文件
      const manuscriptFiles = new Set<string>();
      if (existsSync(paths.manuscriptDir)) {
        const volumes = readdirSync(paths.manuscriptDir, { withFileTypes: true })
          .filter((d) => d.isDirectory());
        for (const vol of volumes) {
          const volDir = join(paths.manuscriptDir, vol.name);
          const files = readdirSync(volDir).filter((f) => f.endsWith(".md"));
          for (const f of files) {
            manuscriptFiles.add(f.replace(".md", ""));
          }
        }
      }

      console.log(`大纲: ${plot.name} (${plot.chapters.length} 章)\n`);
      for (const ch of plot.chapters) {
        const hasFile = manuscriptFiles.has(ch.id) ? "  " : "  (无文件)";
        console.log(`  ${ch.id}  ${ch.title}  [${ch.status}]${hasFile}`);
      }
    });
}
