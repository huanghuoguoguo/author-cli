import { existsSync } from "node:fs";
import { getProjectPaths, listYamlFiles } from "../utils/paths.js";
import { readYaml } from "../utils/yaml.js";
import { CharacterSchema } from "../schemas/character.js";
import { LocationSchema } from "../schemas/location.js";
import { WorldSchema } from "../schemas/world.js";
import { ObjectSchema } from "../schemas/object.js";
import { PlotSchema } from "../schemas/plot.js";
import { RulesSchema } from "../schemas/rules.js";
import { BookSchema } from "../schemas/book.js";

/**
 * 将所有 canon 数据渲染为一个可读的 Markdown 文件。
 */
export function renderCanon(rootDir?: string): string {
  const paths = getProjectPaths(rootDir);
  const lines: string[] = [];

  lines.push("# Canon 数据总览\n");
  lines.push(`> 自动生成于 ${new Date().toISOString()}\n`);

  // Book
  if (existsSync(paths.bookYaml)) {
    const raw = readYaml(paths.bookYaml);
    if (raw) {
      try {
        const book = BookSchema.parse(raw);
        lines.push("## 作品信息\n");
        lines.push(`- **标题**: ${book.title}`);
        lines.push(`- **类型**: ${book.genre}`);
        lines.push(`- **风格**: ${book.style}`);
        lines.push(`- **基调**: ${book.tone}`);
        lines.push(`- **视角**: ${book.pov}`);
        if (book.synopsis) lines.push(`\n${book.synopsis}\n`);
      } catch {
        lines.push("## 作品信息\n\n⚠️ book.yaml schema 校验失败\n");
      }
    }
  }

  // Characters
  const characterFiles = listYamlFiles(paths.charactersDir);
  if (characterFiles.length > 0) {
    lines.push("## 角色\n");
    for (const file of characterFiles) {
      const raw = readYaml(file);
      if (!raw) continue;
      try {
        const char = CharacterSchema.parse(raw);
        lines.push(`### ${char.name} (${char.id})\n`);
        lines.push(`- **类型**: ${char.role} | **状态**: ${char.status}`);
        if (char.age) lines.push(`- **年龄**: ${char.age}`);
        if (char.appearance) lines.push(`- **外貌**: ${char.appearance}`);
        if (char.personality.length) lines.push(`- **性格**: ${char.personality.join(", ")}`);
        if (char.motivation) lines.push(`- **动机**: ${char.motivation}`);
        if (char.speechStyle) lines.push(`- **说话风格**: ${char.speechStyle}`);
        if (char.relationships.length) {
          lines.push("- **关系**:");
          for (const rel of char.relationships) {
            lines.push(`  - ${rel.target}: ${rel.type} (${rel.status})`);
          }
        }
        lines.push("");
      } catch {
        lines.push(`### ${file}\n\n⚠️ schema 校验失败\n`);
      }
    }
  }

  // Locations
  const locationFiles = listYamlFiles(paths.locationsDir);
  if (locationFiles.length > 0) {
    lines.push("## 地点\n");
    for (const file of locationFiles) {
      const raw = readYaml(file);
      if (!raw) continue;
      try {
        const loc = LocationSchema.parse(raw);
        lines.push(`### ${loc.name} (${loc.id})\n`);
        if (loc.description) lines.push(loc.description);
        if (loc.visual) lines.push(`- **视觉**: ${loc.visual}`);
        if (loc.mood) lines.push(`- **氛围**: ${loc.mood}`);
        lines.push("");
      } catch {
        lines.push(`### ${file}\n\n⚠️ schema 校验失败\n`);
      }
    }
  }

  // World
  const worldFiles = listYamlFiles(paths.worldDir);
  if (worldFiles.length > 0) {
    lines.push("## 世界观\n");
    for (const file of worldFiles) {
      const raw = readYaml(file);
      if (!raw) continue;
      try {
        const world = WorldSchema.parse(raw);
        lines.push(`### ${world.name} (${world.id})\n`);
        lines.push(`- **分类**: ${world.category}`);
        if (world.description) lines.push(world.description);
        lines.push("");
      } catch {
        lines.push(`### ${file}\n\n⚠️ schema 校验失败\n`);
      }
    }
  }

  // Objects
  const objectFiles = listYamlFiles(paths.objectsDir);
  if (objectFiles.length > 0) {
    lines.push("## 物品\n");
    for (const file of objectFiles) {
      const raw = readYaml(file);
      if (!raw) continue;
      try {
        const obj = ObjectSchema.parse(raw);
        lines.push(`### ${obj.name} (${obj.id})\n`);
        lines.push(`- **类型**: ${obj.type} | **状态**: ${obj.status}`);
        if (obj.currentHolder) lines.push(`- **持有者**: ${obj.currentHolder}`);
        if (obj.description) lines.push(obj.description);
        lines.push("");
      } catch {
        lines.push(`### ${file}\n\n⚠️ schema 校验失败\n`);
      }
    }
  }

  // Plot
  const plotFiles = listYamlFiles(paths.plotDir);
  if (plotFiles.length > 0) {
    lines.push("## 大纲\n");
    for (const file of plotFiles) {
      const raw = readYaml(file);
      if (!raw) continue;
      try {
        const plot = PlotSchema.parse(raw);
        lines.push(`### ${plot.name} (${plot.id})\n`);
        if (plot.mainConflict) lines.push(`- **核心冲突**: ${plot.mainConflict}`);
        if (plot.currentArc) lines.push(`- **当前弧**: ${plot.currentArc}`);
        if (plot.chapters.length) {
          lines.push("\n**章节**:");
          for (const ch of plot.chapters) {
            lines.push(`- ${ch.id}: ${ch.title} [${ch.status}]`);
          }
        }
        lines.push("");
      } catch {
        lines.push(`### ${file}\n\n⚠️ schema 校验失败\n`);
      }
    }
  }

  // Rules
  const rulesFiles = listYamlFiles(paths.rulesDir);
  if (rulesFiles.length > 0) {
    lines.push("## 写作规则\n");
    for (const file of rulesFiles) {
      const raw = readYaml(file);
      if (!raw) continue;
      try {
        const rules = RulesSchema.parse(raw);
        lines.push(`### ${rules.name} (${rules.id})\n`);
        if (rules.voice) lines.push(`- **声音**: ${rules.voice}`);
        if (rules.mustDo.length) {
          lines.push("\n**必须做**:");
          for (const r of rules.mustDo) lines.push(`- ${r}`);
        }
        if (rules.mustNotDo.length) {
          lines.push("\n**禁止做**:");
          for (const r of rules.mustNotDo) lines.push(`- ${r}`);
        }
        if (rules.rules.length) {
          lines.push("\n**规则**:");
          for (const r of rules.rules) lines.push(`- ${r}`);
        }
        lines.push("");
      } catch {
        lines.push(`### ${file}\n\n⚠️ schema 校验失败\n`);
      }
    }
  }

  return lines.join("\n");
}
