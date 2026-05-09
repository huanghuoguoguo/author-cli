import { join } from "node:path";
import { existsSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { PlotSchema, createDefaultPlot, createDefaultChapterOutline } from "../schemas/plot.js";
import type { Plot } from "../schemas/plot.js";

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
}
