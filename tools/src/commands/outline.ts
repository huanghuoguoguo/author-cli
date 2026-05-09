import { join } from "node:path";
import { existsSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { PlotSchema, createDefaultPlot, createDefaultChapterOutline, ForeshadowingSchema, ChapterOutlineSchema } from "../schemas/plot.js";
import type { Plot, Foreshadowing, ChapterOutline } from "../schemas/plot.js";

function getMainlinePlotPath(): string {
  const paths = getProjectPaths();
  return join(paths.plotDir, "mainline.yaml");
}

function readOrCreateMainline(): { plot: Plot; filePath: string } {
  const filePath = getMainlinePlotPath();
  const raw = readYaml(filePath);
  if (raw) {
    return { plot: PlotSchema.parse(raw), filePath };
  }
  // 自动创建 mainline
  const plot = createDefaultPlot("mainline", "主线");
  writeYaml(filePath, plot);
  return { plot, filePath };
}

export function registerOutlineCommand(program: any) {
  const outline = program
    .command("outline")
    .description("管理大纲和章节");

  // outline add-chapter
  outline
    .command("add-chapter")
    .description("添加新章节到大纲")
    .requiredOption("--id <id>", "章节 ID (如 ch001)")
    .requiredOption("--title <title>", "章节标题")
    .option("--volume <volume>", "所属分卷")
    .action((opts: { id: string; title: string; volume?: string }) => {
      const { plot, filePath } = readOrCreateMainline();

      if (plot.chapters.some((ch) => ch.id === opts.id)) {
        console.error(`章节已存在: ${opts.id}`);
        process.exit(1);
      }

      const chapter = createDefaultChapterOutline(opts.id, opts.title);
      plot.chapters.push(chapter);
      writeYaml(filePath, plot);
      console.log(`✓ 章节已添加: ${opts.id} - ${opts.title}`);
    });

  // outline update-chapter
  outline
    .command("update-chapter <id>")
    .description("更新大纲中的章节字段")
    .requiredOption("--field <field>", "字段名")
    .requiredOption("--value <value>", "新值")
    .action((id: string, opts: { field: string; value: string }) => {
      const { plot, filePath } = readOrCreateMainline();
      const chapter = plot.chapters.find((ch) => ch.id === id);

      if (!chapter) {
        console.error(`章节不存在: ${id}`);
        process.exit(1);
      }

      if (opts.field === "beats" || opts.field === "involvedCharacters" || opts.field === "involvedLocations" || opts.field === "unresolvedAfter") {
        (chapter as any)[opts.field] = opts.value.split(",").map((s) => s.trim());
      } else if (opts.field in chapter) {
        (chapter as any)[opts.field] = opts.value;
      } else {
        console.error(`未知字段: ${opts.field}`);
        process.exit(1);
      }

      // 写入前校验，确保字段值合法
      try {
        ChapterOutlineSchema.parse(chapter);
      } catch (e: any) {
        console.error(`字段值校验失败: ${e.message}`);
        process.exit(1);
      }

      writeYaml(filePath, plot);
      console.log(`✓ 章节 ${id} 已更新: ${opts.field}`);
    });

  // outline list
  outline
    .command("list")
    .description("列出大纲中的章节")
    .action(() => {
      const { plot } = readOrCreateMainline();

      if (plot.chapters.length === 0) {
        console.log("大纲中暂无章节");
        return;
      }

      console.log(`大纲: ${plot.name} (${plot.chapters.length} 章)\n`);
      for (const ch of plot.chapters) {
        console.log(`  ${ch.id}  ${ch.title}  [${ch.status}]`);
        if (ch.purpose) console.log(`         ${ch.purpose}`);
      }
    });

  // ==================== 伏笔管理 ====================

  // foreshadowing add
  outline
    .command("foreshadowing-add")
    .description("添加伏笔")
    .requiredOption("--id <id>", "伏笔 ID")
    .requiredOption("--setup <chapter>", "埋设章节")
    .option("--payoff <chapter>", "回收章节")
    .option("--note <note>", "伏笔说明")
    .action((opts: { id: string; setup: string; payoff?: string; note?: string }) => {
      const { plot, filePath } = readOrCreateMainline();

      if (plot.foreshadowing.some((f) => f.id === opts.id)) {
        console.error(`伏笔已存在: ${opts.id}`);
        process.exit(1);
      }

      const foreshadow: Foreshadowing = ForeshadowingSchema.parse({
        id: opts.id,
        setupChapter: opts.setup,
        payoffChapter: opts.payoff || null,
        note: opts.note || "",
        status: opts.payoff ? "planted" : "open",
      });

      plot.foreshadowing.push(foreshadow);
      writeYaml(filePath, plot);
      console.log(`✓ 伏笔已添加: ${opts.id}`);
      console.log(`  埋设: ${opts.setup}`);
      if (opts.payoff) console.log(`  回收: ${opts.payoff}`);
    });

  // foreshadowing update
  outline
    .command("foreshadowing-update <id>")
    .description("更新伏笔")
    .requiredOption("--field <field>", "字段名 (setupChapter, payoffChapter, status, note)")
    .requiredOption("--value <value>", "新值")
    .action((id: string, opts: { field: string; value: string }) => {
      const { plot, filePath } = readOrCreateMainline();
      const foreshadow = plot.foreshadowing.find((f) => f.id === id);

      if (!foreshadow) {
        console.error(`伏笔不存在: ${id}`);
        process.exit(1);
      }

      if (opts.field in foreshadow) {
        (foreshadow as any)[opts.field] = opts.value;
      } else {
        console.error(`未知字段: ${opts.field}`);
        process.exit(1);
      }

      // 写入前校验，确保字段值合法
      try {
        ForeshadowingSchema.parse(foreshadow);
      } catch (e: any) {
        console.error(`字段值校验失败: ${e.message}`);
        process.exit(1);
      }

      writeYaml(filePath, plot);
      console.log(`✓ 伏笔 ${id} 已更新: ${opts.field}`);
    });

  // foreshadowing list
  outline
    .command("foreshadowing-list")
    .description("列出所有伏笔")
    .option("--status <status>", "按状态筛选 (open, planted, payoff, abandoned)")
    .action((opts: { status?: string }) => {
      const { plot } = readOrCreateMainline();

      if (plot.foreshadowing.length === 0) {
        console.log("暂无伏笔");
        return;
      }

      const filtered = opts.status
        ? plot.foreshadowing.filter((f) => f.status === opts.status)
        : plot.foreshadowing;

      console.log(`伏笔列表 (${filtered.length} 条)\n`);
      for (const f of filtered) {
        const payoff = f.payoffChapter ? `→ ${f.payoffChapter}` : "(未回收)";
        console.log(`  ${f.id}  [${f.status}]  ${f.setupChapter} ${payoff}`);
        if (f.note) console.log(`       ${f.note}`);
      }
    });
}
