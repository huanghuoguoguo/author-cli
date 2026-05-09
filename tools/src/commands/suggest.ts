import { join } from "node:path";
import { existsSync, readFileSync, mkdirSync, readdirSync } from "node:fs";
import { getProjectPaths, listYamlFiles } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { createDefaultProposal } from "../schemas/proposal.js";
import { CharacterSchema } from "../schemas/character.js";
import { LocationSchema } from "../schemas/location.js";
import { WorldSchema } from "../schemas/world.js";
import { ObjectSchema } from "../schemas/object.js";
import { PlotSchema } from "../schemas/plot.js";

/**
 * 从章节正文中提取可能的 canon 变更建议。
 * 这是一个基础实现：通过比对正文中的名字和现有 canon，找出未登记的实体。
 */
function extractSuggestions(chapterId: string, text: string) {
  const paths = getProjectPaths();
  const suggestions: any[] = [];

  // 收集所有已知实体名称
  const knownNames = new Set<string>();
  const knownIds = new Set<string>();

  // 角色
  const characterFiles = listYamlFiles(paths.charactersDir);
  for (const file of characterFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const char = CharacterSchema.parse(raw);
      knownNames.add(char.name);
      knownIds.add(char.id);
      for (const alias of char.aliases) knownNames.add(alias);
    } catch {
      continue;
    }
  }

  // 地点
  const locationFiles = listYamlFiles(paths.locationsDir);
  for (const file of locationFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const loc = LocationSchema.parse(raw);
      knownNames.add(loc.name);
      knownIds.add(loc.id);
    } catch {
      continue;
    }
  }

  // 世界观
  const worldFiles = listYamlFiles(paths.worldDir);
  for (const file of worldFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const world = WorldSchema.parse(raw);
      knownNames.add(world.name);
      knownIds.add(world.id);
    } catch {
      continue;
    }
  }

  // 物品
  const objectFiles = listYamlFiles(paths.objectsDir);
  for (const file of objectFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const obj = ObjectSchema.parse(raw);
      knownNames.add(obj.name);
      knownIds.add(obj.id);
    } catch {
      continue;
    }
  }

  // 大纲中的章节
  const plotFiles = listYamlFiles(paths.plotDir);
  for (const file of plotFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const plot = PlotSchema.parse(raw);
      for (const ch of plot.chapters) {
        knownIds.add(ch.id);
      }
    } catch {
      continue;
    }
  }

  // 检查大纲中当前章节的信息
  let chapterInfo: any = null;
  for (const file of plotFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const plot = PlotSchema.parse(raw);
      const ch = plot.chapters.find((c) => c.id === chapterId);
      if (ch) {
        chapterInfo = ch;
        break;
      }
    } catch {
      continue;
    }
  }

  // 如果大纲中有 involvedCharacters，检查正文是否提到了新角色
  if (chapterInfo?.involvedCharacters) {
    for (const charId of chapterInfo.involvedCharacters) {
      if (!knownIds.has(charId)) {
        suggestions.push({
          action: "create",
          entityType: "character",
          entityId: charId,
          value: { name: charId, role: "mentioned" },
          reason: `大纲中引用了未登记的角色: ${charId}`,
          confidence: 0.9,
        });
      }
    }
  }

  // 检查正文中的引号对话，可能暗示新角色
  // 改进的正则：名字后面直接跟说话动词
  // 名字前面必须是句子分隔符（逗号/句号/空格/换行）或句子开头
  const dialoguePattern = /["「](.+?)["」]/g;
  const dialogueSpeakers = new Map<string, number>(); // speaker -> occurrence count
  let match;
  while ((match = dialoguePattern.exec(text)) !== null) {
    const before = text.substring(Math.max(0, match.index - 25), match.index);

    // 精确匹配：句子分隔符 + 名字 + 说话动词
    // 说话动词包括：说、道、问、答、喊、叫、笑、叹，以及组合如"笑道"、"叹道"、"低声道"
    const speakerMatch = before.match(/(?:^|[，。！？\s\n])([一-龥]{2,4})\s*(?:说|道|问|答|喊|叫|笑|叹|低声|高声|轻声|沉声)[^一-龥]*$/);
    if (speakerMatch && speakerMatch[1].length >= 2 && speakerMatch[1].length <= 4) {
      // 检查名字前面是否紧跟着另一个汉字（避免成语中的误匹配）
      const nameStart = before.lastIndexOf(speakerMatch[1]);
      if (nameStart > 0) {
        const charBeforeName = before[nameStart - 1];
        // 如果名字前面是汉字，可能是成语的一部分，跳过
        if (/[一-龥]/.test(charBeforeName)) continue;
      }
      // 排除常见的误识别词汇
      const falsePositives = ["意味", "意味深", "深深", "轻轻", "缓缓", "渐渐", "慢慢"];
      if (falsePositives.includes(speakerMatch[1])) continue;

      // 计算出现次数
      const current = dialogueSpeakers.get(speakerMatch[1]) || 0;
      dialogueSpeakers.set(speakerMatch[1], current + 1);
    }
  }

  // 检查说话者是否在已知名单中
  for (const [speaker, count] of dialogueSpeakers) {
    if (!knownNames.has(speaker) && speaker.length >= 2) {
      // 多次出现的说话者置信度更高
      const confidence = count >= 3 ? 0.8 : count >= 2 ? 0.7 : 0.6;
      suggestions.push({
        action: "create",
        entityType: "character",
        entityId: speaker,
        value: { name: speaker, role: "mentioned" },
        reason: `正文中出现了可能是新角色的说话者: "${speaker}" (${count} 次对话)`,
        confidence,
      });
    }
  }

  // 为已知角色生成备注建议
  for (const file of characterFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const char = CharacterSchema.parse(raw);
      if (text.includes(char.name)) {
        // 检查该角色是否已有此章节的备注
        const hasNoteForChapter = char.notes.some((n) => n.chapter === chapterId);
        if (!hasNoteForChapter) {
          suggestions.push({
            action: "append",
            entityType: "character",
            entityId: char.id,
            field: "notes",
            value: { chapter: chapterId, text: `在本章出场` },
            reason: `角色 ${char.name} 在本章出场，建议添加章节备注`,
            confidence: 0.7,
          });
        }
      }
    } catch {
      continue;
    }
  }

  return suggestions;
}

export function registerSuggestCommand(program: any) {
  program
    .command("suggest")
    .description("从章节正文中提取 canon 变更建议")
    .requiredOption("--chapter <chapter>", "章节 ID")
    .action((opts: { chapter: string }) => {
      const paths = getProjectPaths();

      // 读取章节正文
      const volumes = existsSync(paths.manuscriptDir)
        ? readdirSync(paths.manuscriptDir, { withFileTypes: true })
            .filter((d: any) => d.isDirectory())
            .map((d: any) => join(paths.manuscriptDir, d.name))
        : [];

      let chapterContent: string | null = null;
      for (const volDir of volumes) {
        const chapterFile = join(volDir, `${opts.chapter}.md`);
        if (existsSync(chapterFile)) {
          chapterContent = readFileSync(chapterFile, "utf-8");
          break;
        }
      }

      if (!chapterContent) {
        console.error(`章节文件不存在: ${opts.chapter}`);
        process.exit(1);
      }

      // 提取建议
      const suggestions = extractSuggestions(opts.chapter, chapterContent);

      if (suggestions.length === 0) {
        console.log("未发现需要更新的 canon 变更建议");
        return;
      }

      // 生成提案
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const proposalId = `proposal-${dateStr}-${opts.chapter}`;
      const proposal = createDefaultProposal(proposalId, opts.chapter);
      proposal.suggestions = suggestions;

      // 保存提案
      const proposalDir = join(paths.proposalsDir, "canon-suggestions");
      mkdirSync(proposalDir, { recursive: true });
      const proposalPath = join(proposalDir, `${proposalId}.yaml`);
      writeYaml(proposalPath, proposal);

      console.log(`✓ 提案已生成: ${proposalId}`);
      console.log(`  文件: ${proposalPath}`);
      console.log(`  建议: ${suggestions.length} 条\n`);

      for (const s of suggestions) {
        console.log(`  - [${s.entityType}] ${s.action} ${s.entityId}${s.field ? "." + s.field : ""}`);
        console.log(`    ${s.reason} (置信度: ${s.confidence})`);
      }

      console.log(`\n使用以下命令应用或拒绝:`);
      console.log(`  npm run author -- proposal apply ${proposalId}`);
      console.log(`  npm run author -- proposal reject ${proposalId}`);
    });
}
