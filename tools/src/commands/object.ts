import { join } from "node:path";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { ObjectSchema, createDefaultObject } from "../schemas/object.js";
import type { NovelObject } from "../schemas/object.js";

function getObjectPath(id: string): string {
  const paths = getProjectPaths();
  return join(paths.objectsDir, `${id}.yaml`);
}

function readObject(id: string): NovelObject {
  const filePath = getObjectPath(id);
  const raw = readYaml(filePath);
  if (!raw) {
    console.error(`物品不存在: ${id}`);
    process.exit(1);
  }
  return ObjectSchema.parse(raw);
}

export function registerObjectCommand(program: any) {
  const object = program
    .command("object")
    .description("管理物品/道具设定");

  object
    .command("add")
    .description("添加新物品")
    .requiredOption("--id <id>", "物品 ID")
    .requiredOption("--name <name>", "物品名称")
    .option("--type <type>", "物品类型 (clue/weapon/artifact/document/key/symbol/other)", "other")
    .action((opts: { id: string; name: string; type: string }) => {
      const paths = getProjectPaths();
      const filePath = join(paths.objectsDir, `${opts.id}.yaml`);

      if (existsSync(filePath)) {
        console.error(`物品已存在: ${opts.id}`);
        process.exit(1);
      }

      const obj = createDefaultObject(opts.id, opts.name, opts.type);
      writeYaml(filePath, obj);
      console.log(`✓ 物品已创建: ${opts.id} (${opts.name})`);
    });

  object
    .command("update <id>")
    .description("更新物品字段")
    .requiredOption("--field <field>", "字段名")
    .requiredOption("--value <value>", "新值")
    .action((id: string, opts: { field: string; value: string }) => {
      const obj = readObject(id);
      const filePath = getObjectPath(id);

      if (opts.field === "rules" || opts.field === "relatedPlot") {
        (obj as any)[opts.field] = opts.value.split(",").map((s) => s.trim());
      } else if (opts.field in obj) {
        (obj as any)[opts.field] = opts.value;
      } else {
        console.error(`未知字段: ${opts.field}`);
        process.exit(1);
      }

      writeYaml(filePath, obj);
      console.log(`✓ 物品 ${id} 已更新: ${opts.field}`);
    });

  object
    .command("show <id>")
    .description("显示物品详情")
    .action((id: string) => {
      const obj = readObject(id);
      console.log(JSON.stringify(obj, null, 2));
    });

  object
    .command("list")
    .description("列出所有物品")
    .action(() => {
      const paths = getProjectPaths();
      if (!existsSync(paths.objectsDir)) {
        console.log("暂无物品");
        return;
      }

      const files = readdirSync(paths.objectsDir).filter((f) => f.endsWith(".yaml"));
      if (files.length === 0) {
        console.log("暂无物品");
        return;
      }

      console.log(`共 ${files.length} 个物品:\n`);
      for (const file of files) {
        const raw = readYaml(join(paths.objectsDir, file));
        if (!raw) continue;
        try {
          const obj = ObjectSchema.parse(raw);
          console.log(`  ${obj.id}  ${obj.name}  [${obj.type}]  ${obj.status}  持有者: ${obj.currentHolder || "-"}`);
        } catch {
          console.log(`  ${file}  (schema 错误)`);
        }
      }
    });

  object
    .command("note <id>")
    .description("为物品添加备注")
    .requiredOption("--chapter <chapter>", "章节 ID")
    .requiredOption("--text <text>", "备注内容")
    .action((id: string, opts: { chapter: string; text: string }) => {
      const obj = readObject(id);
      const filePath = getObjectPath(id);

      obj.notes.push({ chapter: opts.chapter, text: opts.text });
      writeYaml(filePath, obj);
      console.log(`✓ 已为物品 ${id} 添加备注 (章节: ${opts.chapter})`);
    });

  // object delete
  object
    .command("delete <id>")
    .description("删除物品")
    .action((id: string) => {
      const filePath = getObjectPath(id);
      if (!existsSync(filePath)) {
        console.error(`物品不存在: ${id}`);
        process.exit(1);
      }
      unlinkSync(filePath);
      console.log(`✓ 物品已删除: ${id}`);
    });
}
