import { join } from "node:path";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { CharacterSchema, createDefaultCharacter } from "../schemas/character.js";
import type { Character } from "../schemas/character.js";

function getCharacterPath(id: string): string {
  const paths = getProjectPaths();
  return join(paths.charactersDir, `${id}.yaml`);
}

function readCharacter(id: string): Character {
  const filePath = getCharacterPath(id);
  const raw = readYaml(filePath);
  if (!raw) {
    console.error(`角色不存在: ${id}`);
    process.exit(1);
  }
  return CharacterSchema.parse(raw);
}

export function registerCharacterCommand(program: any) {
  const character = program
    .command("character")
    .description("管理角色设定");

  // character add
  character
    .command("add")
    .description("添加新角色")
    .requiredOption("--id <id>", "角色 ID")
    .requiredOption("--name <name>", "角色名称")
    .option("--role <role>", "角色类型", "supporting")
    .action((opts: { id: string; name: string; role: string }) => {
      const paths = getProjectPaths();
      const filePath = join(paths.charactersDir, `${opts.id}.yaml`);

      if (existsSync(filePath)) {
        console.error(`角色已存在: ${opts.id}`);
        process.exit(1);
      }

      const character = createDefaultCharacter(opts.id, opts.name, opts.role);
      writeYaml(filePath, character);
      console.log(`✓ 角色已创建: ${opts.id} (${opts.name})`);
    });

  // character update
  character
    .command("update <id>")
    .description("更新角色字段")
    .requiredOption("--field <field>", "字段名")
    .requiredOption("--value <value>", "新值")
    .action((id: string, opts: { field: string; value: string }) => {
      const char = readCharacter(id);
      const filePath = getCharacterPath(id);

      // 处理特殊字段
      if (opts.field === "personality" || opts.field === "skills" || opts.field === "aliases") {
        (char as any)[opts.field] = opts.value.split(",").map((s) => s.trim());
      } else if (opts.field in char) {
        (char as any)[opts.field] = opts.value;
      } else {
        console.error(`未知字段: ${opts.field}`);
        process.exit(1);
      }

      writeYaml(filePath, char);
      console.log(`✓ 角色 ${id} 已更新: ${opts.field}`);
    });

  // character show
  character
    .command("show <id>")
    .description("显示角色详情")
    .action((id: string) => {
      const char = readCharacter(id);
      console.log(JSON.stringify(char, null, 2));
    });

  // character list
  character
    .command("list")
    .description("列出所有角色")
    .action(() => {
      const paths = getProjectPaths();
      if (!existsSync(paths.charactersDir)) {
        console.log("暂无角色");
        return;
      }

      const files = readdirSync(paths.charactersDir).filter((f: string) => f.endsWith(".yaml"));

      if (files.length === 0) {
        console.log("暂无角色");
        return;
      }

      console.log(`共 ${files.length} 个角色:\n`);
      for (const file of files) {
        const raw = readYaml(join(paths.charactersDir, file));
        if (!raw) continue;
        try {
          const char = CharacterSchema.parse(raw);
          console.log(`  ${char.id}  ${char.name}  [${char.role}]  ${char.status}`);
        } catch {
          console.log(`  ${file}  (schema 错误)`);
        }
      }
    });

  // character note
  character
    .command("note <id>")
    .description("为角色添加章节备注")
    .requiredOption("--chapter <chapter>", "章节 ID")
    .requiredOption("--text <text>", "备注内容")
    .action((id: string, opts: { chapter: string; text: string }) => {
      const char = readCharacter(id);
      const filePath = getCharacterPath(id);

      char.notes.push({ chapter: opts.chapter, text: opts.text });
      writeYaml(filePath, char);
      console.log(`✓ 已为角色 ${id} 添加备注 (章节: ${opts.chapter})`);
    });

  // character delete
  character
    .command("delete <id>")
    .description("删除角色")
    .action((id: string) => {
      const filePath = getCharacterPath(id);
      if (!existsSync(filePath)) {
        console.error(`角色不存在: ${id}`);
        process.exit(1);
      }
      unlinkSync(filePath);
      console.log(`✓ 角色已删除: ${id}`);
    });
}
