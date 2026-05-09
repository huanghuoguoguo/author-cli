import { join } from "node:path";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { WorldSchema, createDefaultWorld } from "../schemas/world.js";
import type { World } from "../schemas/world.js";

function getWorldPath(id: string): string {
  const paths = getProjectPaths();
  return join(paths.worldDir, `${id}.yaml`);
}

function readWorld(id: string): World {
  const filePath = getWorldPath(id);
  const raw = readYaml(filePath);
  if (!raw) {
    console.error(`世界观不存在: ${id}`);
    process.exit(1);
  }
  return WorldSchema.parse(raw);
}

export function registerWorldCommand(program: any) {
  const world = program
    .command("world")
    .description("管理世界观设定");

  world
    .command("add")
    .description("添加新世界观")
    .requiredOption("--id <id>", "世界观 ID")
    .requiredOption("--name <name>", "世界观名称")
    .option("--category <category>", "分类 (history/society/culture/powerSystem/geography/technology/religion/economy)", "society")
    .action((opts: { id: string; name: string; category: string }) => {
      const paths = getProjectPaths();
      const filePath = join(paths.worldDir, `${opts.id}.yaml`);

      if (existsSync(filePath)) {
        console.error(`世界观已存在: ${opts.id}`);
        process.exit(1);
      }

      const item = createDefaultWorld(opts.id, opts.name, opts.category);
      writeYaml(filePath, item);
      console.log(`✓ 世界观已创建: ${opts.id} (${opts.name})`);
    });

  world
    .command("update <id>")
    .description("更新世界观字段")
    .requiredOption("--field <field>", "字段名")
    .requiredOption("--value <value>", "新值")
    .action((id: string, opts: { field: string; value: string }) => {
      const item = readWorld(id);
      const filePath = getWorldPath(id);

      if (opts.field === "rules" || opts.field === "history" || opts.field === "factions" || opts.field === "constraints") {
        (item as any)[opts.field] = opts.value.split(",").map((s) => s.trim());
      } else if (opts.field in item) {
        (item as any)[opts.field] = opts.value;
      } else {
        console.error(`未知字段: ${opts.field}`);
        process.exit(1);
      }

      writeYaml(filePath, item);
      console.log(`✓ 世界观 ${id} 已更新: ${opts.field}`);
    });

  world
    .command("show <id>")
    .description("显示世界观详情")
    .action((id: string) => {
      const item = readWorld(id);
      console.log(JSON.stringify(item, null, 2));
    });

  world
    .command("list")
    .description("列出所有世界观")
    .action(() => {
      const paths = getProjectPaths();
      if (!existsSync(paths.worldDir)) {
        console.log("暂无世界观");
        return;
      }

      const files = readdirSync(paths.worldDir).filter((f) => f.endsWith(".yaml"));
      if (files.length === 0) {
        console.log("暂无世界观");
        return;
      }

      console.log(`共 ${files.length} 个世界观:\n`);
      for (const file of files) {
        const raw = readYaml(join(paths.worldDir, file));
        if (!raw) continue;
        try {
          const item = WorldSchema.parse(raw);
          console.log(`  ${item.id}  ${item.name}  [${item.category}]`);
        } catch {
          console.log(`  ${file}  (schema 错误)`);
        }
      }
    });

  world
    .command("note <id>")
    .description("为世界观添加备注")
    .requiredOption("--chapter <chapter>", "章节 ID")
    .requiredOption("--text <text>", "备注内容")
    .action((id: string, opts: { chapter: string; text: string }) => {
      const item = readWorld(id);
      const filePath = getWorldPath(id);

      item.notes.push({ chapter: opts.chapter, text: opts.text });
      writeYaml(filePath, item);
      console.log(`✓ 已为世界观 ${id} 添加备注 (章节: ${opts.chapter})`);
    });

  // world delete
  world
    .command("delete <id>")
    .description("删除世界观")
    .action((id: string) => {
      const filePath = getWorldPath(id);
      if (!existsSync(filePath)) {
        console.error(`世界观不存在: ${id}`);
        process.exit(1);
      }
      unlinkSync(filePath);
      console.log(`✓ 世界观已删除: ${id}`);
    });
}
