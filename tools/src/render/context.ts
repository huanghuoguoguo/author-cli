import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getProjectPaths, listYamlFiles, readProject } from "../utils/paths.js";
import { readYaml } from "../utils/yaml.js";
import { CharacterSchema } from "../schemas/character.js";
import { LocationSchema } from "../schemas/location.js";
import { WorldSchema } from "../schemas/world.js";
import { ObjectSchema } from "../schemas/object.js";
import { PlotSchema } from "../schemas/plot.js";
import { RulesSchema } from "../schemas/rules.js";
import { BookSchema } from "../schemas/book.js";

/**
 * 为指定章节生成 context pack。
 * 优先级：writingRules > currentChapter > characters > plot > bookInfo > world > locations > objects
 */
export function renderContext(chapterId: string, rootDir?: string): string {
  const paths = getProjectPaths(rootDir);
  const project = readProject(paths.root);
  const lines: string[] = [];

  lines.push(`# Context Pack: ${chapterId}\n`);
  lines.push(`> 自动生成于 ${new Date().toISOString()}\n`);

  // 1. 写作规则（最高优先级）
  const rulesFiles = listYamlFiles(paths.rulesDir);
  if (rulesFiles.length > 0) {
    lines.push("---\n## 写作规则\n");
    for (const file of rulesFiles) {
      const raw = readYaml(file);
      if (!raw) continue;
      try {
        const rules = RulesSchema.parse(raw);
        if (rules.mustDo.length) {
          lines.push("**必须做**:");
          for (const r of rules.mustDo) lines.push(`- ${r}`);
          lines.push("");
        }
        if (rules.mustNotDo.length) {
          lines.push("**禁止做**:");
          for (const r of rules.mustNotDo) lines.push(`- ${r}`);
          lines.push("");
        }
        if (rules.voice) lines.push(`**叙事声音**: ${rules.voice}\n`);
        if (rules.dialogueRules.length) {
          lines.push("**对白规则**:");
          for (const r of rules.dialogueRules) lines.push(`- ${r}`);
          lines.push("");
        }
      } catch {
        continue;
      }
    }
  }

  // 2. 当前章节信息
  lines.push("---\n## 当前章节\n");
  let chapterInfo: any = null;

  // 从大纲中查找
  const plotFiles = listYamlFiles(paths.plotDir);
  for (const file of plotFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const plot = PlotSchema.parse(raw);
      const chapter = plot.chapters.find((ch) => ch.id === chapterId);
      if (chapter) {
        chapterInfo = chapter;
        lines.push(`- **ID**: ${chapter.id}`);
        lines.push(`- **标题**: ${chapter.title}`);
        lines.push(`- **状态**: ${chapter.status}`);
        if (chapter.purpose) lines.push(`- **目的**: ${chapter.purpose}`);
        if (chapter.beats.length) {
          lines.push("- **节拍**:");
          for (const beat of chapter.beats) lines.push(`  - ${beat}`);
        }
        break;
      }
    } catch {
      continue;
    }
  }

  if (!chapterInfo) {
    lines.push(`(大纲中未找到章节 ${chapterId})\n`);
  }

  // 3. 作品信息
  if (existsSync(paths.bookYaml)) {
    const raw = readYaml(paths.bookYaml);
    if (raw) {
      try {
        const book = BookSchema.parse(raw);
        lines.push("\n---\n## 作品信息\n");
        if (book.title) lines.push(`- **标题**: ${book.title}`);
        if (book.genre) lines.push(`- **类型**: ${book.genre}`);
        if (book.style) lines.push(`- **风格**: ${book.style}`);
        if (book.tone) lines.push(`- **基调**: ${book.tone}`);
        if (book.pov) lines.push(`- **视角**: ${book.pov}`);
        if (book.synopsis) lines.push(`\n${book.synopsis}\n`);
      } catch {
        // skip
      }
    }
  }

  // 4. 相关角色
  const involvedCharacters = chapterInfo?.involvedCharacters ?? [];
  const characterFiles = listYamlFiles(paths.charactersDir);
  const relevantCharacters: string[] = [];

  for (const file of characterFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const char = CharacterSchema.parse(raw);
      // 如果章节指定了相关角色，只包含这些；否则包含所有活跃角色
      const isRelevant = involvedCharacters.length > 0
        ? involvedCharacters.includes(char.id)
        : char.status === "active";

      if (isRelevant) {
        relevantCharacters.push(char.id);
        lines.push(`\n---\n## 角色: ${char.name}\n`);
        lines.push(`- **类型**: ${char.role}`);
        if (char.age) lines.push(`- **年龄**: ${char.age}`);
        if (char.appearance) lines.push(`- **外貌**: ${char.appearance}`);
        if (char.personality.length) lines.push(`- **性格**: ${char.personality.join(", ")}`);
        if (char.motivation) lines.push(`- **动机**: ${char.motivation}`);
        if (char.speechStyle) lines.push(`- **说话风格**: ${char.speechStyle}`);
        if (char.arc.currentState) lines.push(`- **当前状态**: ${char.arc.currentState}`);
        if (char.relationships.length) {
          lines.push("- **关系**:");
          for (const rel of char.relationships) {
            lines.push(`  - ${rel.target}: ${rel.type}`);
          }
        }
        // 最近的备注
        const recentNotes = char.notes.slice(-3);
        if (recentNotes.length) {
          lines.push("- **近期备注**:");
          for (const note of recentNotes) {
            lines.push(`  - [${note.chapter}] ${note.text}`);
          }
        }
      }
    } catch {
      continue;
    }
  }

  // 5. 大纲/当前故事弧
  if (plotFiles.length > 0) {
    lines.push("\n---\n## 大纲\n");
    for (const file of plotFiles) {
      const raw = readYaml(file);
      if (!raw) continue;
      try {
        const plot = PlotSchema.parse(raw);
        if (plot.mainConflict) lines.push(`**核心冲突**: ${plot.mainConflict}`);
        if (plot.currentArc) lines.push(`**当前弧**: ${plot.currentArc}`);

        // 显示当前章节前后的章节
        const chapterIndex = plot.chapters.findIndex((ch) => ch.id === chapterId);
        if (chapterIndex >= 0) {
          const start = Math.max(0, chapterIndex - 2);
          const end = Math.min(plot.chapters.length, chapterIndex + 3);
          lines.push("\n**章节进度**:");
          for (let i = start; i < end; i++) {
            const ch = plot.chapters[i];
            const marker = ch.id === chapterId ? " ← 当前" : "";
            lines.push(`- ${ch.id}: ${ch.title} [${ch.status}]${marker}`);
          }
        }

        // 未解决的伏笔
        const openForeshadowing = plot.foreshadowing.filter(
          (f) => f.status === "open" || f.status === "planted"
        );
        if (openForeshadowing.length) {
          lines.push("\n**未解决伏笔**:");
          for (const f of openForeshadowing) {
            lines.push(`- ${f.id}: ${f.note} (埋设于 ${f.setupChapter})`);
          }
        }
        lines.push("");
      } catch {
        continue;
      }
    }
  }

  // 6. 相关世界观
  const worldFiles = listYamlFiles(paths.worldDir);
  if (worldFiles.length > 0) {
    let hasHeader = false;
    for (const file of worldFiles) {
      const raw = readYaml(file);
      if (!raw) continue;
      try {
        const world = WorldSchema.parse(raw);
        if (!hasHeader) {
          lines.push("\n---\n## 世界观\n");
          hasHeader = true;
        }
        lines.push(`### ${world.name}\n`);
        if (world.description) lines.push(world.description);
        if (world.rules.length) {
          lines.push("\n规则:");
          for (const r of world.rules) lines.push(`- ${r}`);
        }
        lines.push("");
      } catch {
        continue;
      }
    }
  }

  // 7. 相关地点
  const involvedLocations = chapterInfo?.involvedLocations ?? [];
  const locationFiles = listYamlFiles(paths.locationsDir);
  if (locationFiles.length > 0) {
    let hasHeader = false;
    for (const file of locationFiles) {
      const raw = readYaml(file);
      if (!raw) continue;
      try {
        const loc = LocationSchema.parse(raw);
        const isRelevant = involvedLocations.length > 0
          ? involvedLocations.includes(loc.id)
          : true;

        if (isRelevant) {
          if (!hasHeader) {
            lines.push("\n---\n## 地点\n");
            hasHeader = true;
          }
          lines.push(`### ${loc.name}\n`);
          if (loc.visual) lines.push(`- **视觉**: ${loc.visual}`);
          if (loc.audio) lines.push(`- **听觉**: ${loc.audio}`);
          if (loc.mood) lines.push(`- **氛围**: ${loc.mood}`);
          lines.push("");
        }
      } catch {
        continue;
      }
    }
  }

  // 8. 相关物品
  const objectFiles = listYamlFiles(paths.objectsDir);
  if (objectFiles.length > 0) {
    let hasHeader = false;
    for (const file of objectFiles) {
      const raw = readYaml(file);
      if (!raw) continue;
      try {
        const obj = ObjectSchema.parse(raw);
        if (!hasHeader) {
          lines.push("\n---\n## 物品\n");
          hasHeader = true;
        }
        lines.push(`- **${obj.name}**: ${obj.description || obj.type}`);
        if (obj.currentHolder) lines.push(`  持有者: ${obj.currentHolder}`);
      } catch {
        continue;
      }
    }
  }

  // 9. 前文摘要
  if (chapterInfo) {
    const plotForChapters = plotFiles
      .map((file) => {
        const raw = readYaml(file);
        if (!raw) return null;
        try { return PlotSchema.parse(raw); } catch { return null; }
      })
      .filter(Boolean)[0];

    if (plotForChapters) {
      const chapterIndex = plotForChapters.chapters.findIndex((ch) => ch.id === chapterId);
      if (chapterIndex > 0) {
        const prevCount = project?.defaultContext?.previousChapterCount ?? 2;
        const start = Math.max(0, chapterIndex - prevCount);
        const prevChapters = plotForChapters.chapters.slice(start, chapterIndex);

        if (prevChapters.length > 0) {
          lines.push("\n---\n## 前文章节\n");
          for (const ch of prevChapters) {
            lines.push(`### ${ch.id}: ${ch.title}`);
            if (ch.purpose) lines.push(ch.purpose);
            if (ch.beats.length) {
              for (const beat of ch.beats) lines.push(`- ${beat}`);
            }
            lines.push("");
          }
        }
      }
    }
  }

  // 10. 当前章节正文窗口
  const windowChars = project?.defaultContext?.currentChapterWindowChars ?? 5000;
  const chapterContent = findChapterContent(paths.manuscriptDir, chapterId);
  if (chapterContent) {
    lines.push("\n---\n## 当前章节正文（尾部窗口）\n");
    if (chapterContent.length > windowChars) {
      const window = chapterContent.slice(-windowChars);
      lines.push(`(... 前文省略 ...)\n`);
      lines.push(window);
    } else {
      lines.push(chapterContent);
    }
  }

  return lines.join("\n");
}

/**
 * 查找章节正文文件。
 */
function findChapterContent(manuscriptDir: string, chapterId: string): string | null {
  if (!existsSync(manuscriptDir)) return null;

  const volumes = readdirSync(manuscriptDir, { withFileTypes: true })
    .filter((d: any) => d.isDirectory())
    .map((d: any) => join(manuscriptDir, d.name));

  for (const volDir of volumes) {
    const chapterFile = join(volDir, `${chapterId}.md`);
    if (existsSync(chapterFile)) {
      return readFileSync(chapterFile, "utf-8");
    }
  }

  return null;
}
