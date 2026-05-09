import { join } from "node:path";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { LocationSchema, createDefaultLocation } from "../schemas/location.js";
import type { Location } from "../schemas/location.js";

function getLocationPath(id: string): string {
  const paths = getProjectPaths();
  return join(paths.locationsDir, `${id}.yaml`);
}

function readLocation(id: string): Location {
  const filePath = getLocationPath(id);
  const raw = readYaml(filePath);
  if (!raw) {
    console.error(`地点不存在: ${id}`);
    process.exit(1);
  }
  return LocationSchema.parse(raw);
}

export function registerLocationCommand(program: any) {
  const location = program
    .command("location")
    .description("管理地点设定");

  location
    .command("add")
    .description("添加新地点")
    .requiredOption("--id <id>", "地点 ID")
    .requiredOption("--name <name>", "地点名称")
    .option("--type <type>", "地点类型", "")
    .action((opts: { id: string; name: string; type: string }) => {
      const paths = getProjectPaths();
      const filePath = join(paths.locationsDir, `${opts.id}.yaml`);

      if (existsSync(filePath)) {
        console.error(`地点已存在: ${opts.id}`);
        process.exit(1);
      }

      const loc = createDefaultLocation(opts.id, opts.name);
      if (opts.type) (loc as any).type = opts.type;
      writeYaml(filePath, loc);
      console.log(`✓ 地点已创建: ${opts.id} (${opts.name})`);
    });

  location
    .command("update <id>")
    .description("更新地点字段")
    .requiredOption("--field <field>", "字段名")
    .requiredOption("--value <value>", "新值")
    .action((id: string, opts: { field: string; value: string }) => {
      const loc = readLocation(id);
      const filePath = getLocationPath(id);

      if (opts.field === "rules" || opts.field === "connectedCharacters" || opts.field === "usedInChapters") {
        (loc as any)[opts.field] = opts.value.split(",").map((s) => s.trim());
      } else if (opts.field in loc) {
        (loc as any)[opts.field] = opts.value;
      } else {
        console.error(`未知字段: ${opts.field}`);
        process.exit(1);
      }

      writeYaml(filePath, loc);
      console.log(`✓ 地点 ${id} 已更新: ${opts.field}`);
    });

  location
    .command("show <id>")
    .description("显示地点详情")
    .action((id: string) => {
      const loc = readLocation(id);
      console.log(JSON.stringify(loc, null, 2));
    });

  location
    .command("list")
    .description("列出所有地点")
    .action(() => {
      const paths = getProjectPaths();
      if (!existsSync(paths.locationsDir)) {
        console.log("暂无地点");
        return;
      }

      const files = readdirSync(paths.locationsDir).filter((f) => f.endsWith(".yaml"));
      if (files.length === 0) {
        console.log("暂无地点");
        return;
      }

      console.log(`共 ${files.length} 个地点:\n`);
      for (const file of files) {
        const raw = readYaml(join(paths.locationsDir, file));
        if (!raw) continue;
        try {
          const loc = LocationSchema.parse(raw);
          console.log(`  ${loc.id}  ${loc.name}  [${loc.type || "-"}]  ${loc.status}`);
        } catch {
          console.log(`  ${file}  (schema 错误)`);
        }
      }
    });

  location
    .command("note <id>")
    .description("为地点添加备注")
    .requiredOption("--chapter <chapter>", "章节 ID")
    .requiredOption("--text <text>", "备注内容")
    .action((id: string, opts: { chapter: string; text: string }) => {
      const loc = readLocation(id);
      const filePath = getLocationPath(id);

      loc.notes.push({ chapter: opts.chapter, text: opts.text });
      writeYaml(filePath, loc);
      console.log(`✓ 已为地点 ${id} 添加备注 (章节: ${opts.chapter})`);
    });

  // location delete
  location
    .command("delete <id>")
    .description("删除地点")
    .action((id: string) => {
      const filePath = getLocationPath(id);
      if (!existsSync(filePath)) {
        console.error(`地点不存在: ${id}`);
        process.exit(1);
      }
      unlinkSync(filePath);
      console.log(`✓ 地点已删除: ${id}`);
    });
}
