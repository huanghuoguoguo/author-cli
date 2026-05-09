import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getProjectPaths } from "../utils/paths.js";
import { renderCanon } from "../render/canon.js";
import { renderContext } from "../render/context.js";
import { readYaml } from "../utils/yaml.js";
import { CharacterSchema } from "../schemas/character.js";

export function registerRenderCommand(program: any) {
  const render = program
    .command("render")
    .description("生成可读输出");

  // render canon
  render
    .command("canon")
    .description("将所有 canon 数据渲染为 Markdown")
    .action(() => {
      const paths = getProjectPaths();
      const content = renderCanon();

      mkdirSync(paths.generatedDir, { recursive: true });
      const outputPath = join(paths.generatedDir, "canon.md");
      writeFileSync(outputPath, content, "utf-8");
      console.log(`✓ 已生成: ${outputPath}`);
    });

  // render context
  render
    .command("context")
    .description("为指定章节生成 context pack")
    .requiredOption("--chapter <chapter>", "章节 ID")
    .action((opts: { chapter: string }) => {
      const paths = getProjectPaths();
      const content = renderContext(opts.chapter);

      const contextDir = join(paths.generatedDir, "context");
      mkdirSync(contextDir, { recursive: true });
      const outputPath = join(contextDir, `${opts.chapter}.md`);
      writeFileSync(outputPath, content, "utf-8");
      console.log(`✓ 已生成: ${outputPath}`);
    });

  // render character
  render
    .command("character <id>")
    .description("渲染单个角色为 Markdown")
    .action((id: string) => {
      const paths = getProjectPaths();

      const filePath = join(paths.charactersDir, `${id}.yaml`);
      const raw = readYaml(filePath);
      if (!raw) {
        console.error(`角色不存在: ${id}`);
        process.exit(1);
      }

      const char = CharacterSchema.parse(raw);
      const lines = [`# ${char.name}\n`];
      lines.push(`- **ID**: ${char.id}`);
      lines.push(`- **类型**: ${char.role}`);
      lines.push(`- **状态**: ${char.status}`);
      if (char.age) lines.push(`- **年龄**: ${char.age}`);
      if (char.gender) lines.push(`- **性别**: ${char.gender}`);
      if (char.appearance) lines.push(`- **外貌**: ${char.appearance}`);
      if (char.personality.length) lines.push(`- **性格**: ${char.personality.join(", ")}`);
      if (char.motivation) lines.push(`- **动机**: ${char.motivation}`);
      if (char.speechStyle) lines.push(`- **说话风格**: ${char.speechStyle}`);
      if (char.skills.length) lines.push(`- **技能**: ${char.skills.join(", ")}`);

      if (char.relationships.length) {
        lines.push("\n## 关系\n");
        for (const rel of char.relationships) {
          lines.push(`- **${rel.target}**: ${rel.type} (${rel.status})`);
          if (rel.note) lines.push(`  ${rel.note}`);
        }
      }

      if (char.arc.currentState || char.arc.unresolved.length) {
        lines.push("\n## 角色弧线\n");
        if (char.arc.currentState) lines.push(`**当前状态**: ${char.arc.currentState}`);
        if (char.arc.unresolved.length) {
          lines.push("\n**未解决**:");
          for (const item of char.arc.unresolved) lines.push(`- ${item}`);
        }
        if (char.arc.completed.length) {
          lines.push("\n**已完成**:");
          for (const item of char.arc.completed) lines.push(`- ${item}`);
        }
      }

      if (char.notes.length) {
        lines.push("\n## 备注\n");
        for (const note of char.notes) {
          lines.push(`- [${note.chapter}] ${note.text}`);
        }
      }

      const content = lines.join("\n");
      mkdirSync(paths.generatedDir, { recursive: true });
      const outputPath = join(paths.generatedDir, `character-${id}.md`);
      writeFileSync(outputPath, content, "utf-8");
      console.log(`✓ 已生成: ${outputPath}`);
    });
}
