import { join } from "node:path";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { getProjectPaths, listYamlFiles } from "../utils/paths.js";
import { readYaml } from "../utils/yaml.js";
import { CharacterSchema } from "../schemas/character.js";
import { LocationSchema } from "../schemas/location.js";
import { ObjectSchema } from "../schemas/object.js";
import { PlotSchema } from "../schemas/plot.js";
import { TimelineSchema } from "../schemas/timeline.js";

export interface ContinuityIssue {
  severity: "error" | "warning" | "info";
  category: string;
  chapter?: string;
  entity?: string;
  message: string;
  suggestion?: string;
}

/**
 * 检查章节的连续性问题。
 */
export function checkContinuity(chapterId: string): ContinuityIssue[] {
  const paths = getProjectPaths();
  const issues: ContinuityIssue[] = [];

  // 读取章节正文
  let chapterContent: string | null = null;
  const volumes = existsSync(paths.manuscriptDir)
    ? readdirSync(paths.manuscriptDir, { withFileTypes: true })
        .filter((d: any) => d.isDirectory())
        .map((d: any) => join(paths.manuscriptDir, d.name))
    : [];

  for (const volDir of volumes) {
    const chapterFile = join(volDir, `${chapterId}.md`);
    if (existsSync(chapterFile)) {
      chapterContent = readFileSync(chapterFile, "utf-8");
      break;
    }
  }

  if (!chapterContent) {
    issues.push({
      severity: "error",
      category: "chapter",
      chapter: chapterId,
      message: `章节正文文件不存在`,
      suggestion: `使用 npm run author -- chapter add --id ${chapterId} 创建`,
    });
    return issues;
  }

  // 收集所有已知实体
  const knownCharacters = new Map<string, { name: string; status: string }>();
  const knownLocations = new Map<string, { name: string; status: string }>();
  const knownObjects = new Map<string, { name: string; status: string }>();

  const characterFiles = listYamlFiles(paths.charactersDir);
  for (const file of characterFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const char = CharacterSchema.parse(raw);
      knownCharacters.set(char.id, { name: char.name, status: char.status });
    } catch {
      continue;
    }
  }

  const locationFiles = listYamlFiles(paths.locationsDir);
  for (const file of locationFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const loc = LocationSchema.parse(raw);
      knownLocations.set(loc.id, { name: loc.name, status: loc.status });
    } catch {
      continue;
    }
  }

  const objectFiles = listYamlFiles(paths.objectsDir);
  for (const file of objectFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const obj = ObjectSchema.parse(raw);
      knownObjects.set(obj.id, { name: obj.name, status: obj.status });
    } catch {
      continue;
    }
  }

  // 读取大纲中的章节信息
  let chapterInfo: any = null;
  const plotFiles = listYamlFiles(paths.plotDir);
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

  // 读取时间线
  const timelineRaw = readYaml(paths.timelineYaml);
  let timelineEvents: any[] = [];
  if (timelineRaw) {
    try {
      const timeline = TimelineSchema.parse(timelineRaw);
      timelineEvents = timeline.events;
    } catch {
      // skip
    }
  }

  // === 检查 1: 大纲中引用的角色是否存在 ===
  if (chapterInfo?.involvedCharacters) {
    for (const charId of chapterInfo.involvedCharacters) {
      if (!knownCharacters.has(charId)) {
        issues.push({
          severity: "error",
          category: "character",
          chapter: chapterId,
          entity: charId,
          message: `大纲引用的角色不存在: ${charId}`,
          suggestion: `使用 npm run author -- character add --id ${charId} 创建角色`,
        });
      } else {
        // 检查角色状态
        const char = knownCharacters.get(charId)!;
        if (char.status === "dead" || char.status === "missing") {
          issues.push({
            severity: "warning",
            category: "character",
            chapter: chapterId,
            entity: charId,
            message: `角色 ${char.name} (${charId}) 状态为 ${char.status}，但仍在大纲中标记为本章出场`,
            suggestion: `检查是否是回忆/幻觉场景，或更新角色状态`,
          });
        }
      }
    }
  }

  // === 检查 2: 大纲中引用的地点是否存在 ===
  if (chapterInfo?.involvedLocations) {
    for (const locId of chapterInfo.involvedLocations) {
      if (!knownLocations.has(locId)) {
        issues.push({
          severity: "error",
          category: "location",
          chapter: chapterId,
          entity: locId,
          message: `大纲引用的地点不存在: ${locId}`,
          suggestion: `使用 npm run author -- location add --id ${locId} 创建地点`,
        });
      } else {
        const loc = knownLocations.get(locId)!;
        if (loc.status === "destroyed" || loc.status === "abandoned") {
          issues.push({
            severity: "warning",
            category: "location",
            chapter: chapterId,
            entity: locId,
            message: `地点 ${loc.name} (${locId}) 状态为 ${loc.status}，但仍在大纲中标记为本章使用`,
            suggestion: `检查时间线，或该地点是否在故事后期重建`,
          });
        }
      }
    }
  }

  // === 检查 3: 正文中的角色名是否已登记 ===
  // 检查所有已知角色名是否在正文中出现（反向检查）
  for (const [id, info] of knownCharacters) {
    if (chapterContent.includes(info.name)) {
      // 角色出现在正文中，检查是否在大纲中标记
      if (chapterInfo?.involvedCharacters && !chapterInfo.involvedCharacters.includes(id)) {
        issues.push({
          severity: "info",
          category: "character",
          chapter: chapterId,
          entity: id,
          message: `角色 ${info.name} 出现在正文中，但未在大纲中标记`,
          suggestion: `使用 npm run author -- outline update-chapter ${chapterId} --field involvedCharacters --value "...,${id}"`,
        });
      }
    }
  }

  // === 检查 4: 正文中的地点名是否已登记 ===
  for (const [id, info] of knownLocations) {
    if (chapterContent.includes(info.name)) {
      if (chapterInfo?.involvedLocations && !chapterInfo.involvedLocations.includes(id)) {
        issues.push({
          severity: "info",
          category: "location",
          chapter: chapterId,
          entity: id,
          message: `地点 ${info.name} 出现在正文中，但未在大纲中标记`,
          suggestion: `使用 npm run author -- outline update-chapter ${chapterId} --field involvedLocations --value "...,${id}"`,
        });
      }
    }
  }

  // === 检查 5: 时间线事件与章节的一致性 ===
  const chapterEvents = timelineEvents.filter((e) => e.chapter === chapterId);
  if (chapterEvents.length > 0) {
    for (const evt of chapterEvents) {
      // 检查事件引用的角色是否存在
      for (const charId of evt.characters || []) {
        if (!knownCharacters.has(charId)) {
          issues.push({
            severity: "warning",
            category: "timeline",
            chapter: chapterId,
            entity: evt.id,
            message: `时间线事件 "${evt.title}" 引用了不存在的角色: ${charId}`,
            suggestion: `更新事件或创建角色`,
          });
        }
      }
      // 检查事件引用的地点是否存在
      for (const locId of evt.locations || []) {
        if (!knownLocations.has(locId)) {
          issues.push({
            severity: "warning",
            category: "timeline",
            chapter: chapterId,
            entity: evt.id,
            message: `时间线事件 "${evt.title}" 引用了不存在的地点: ${locId}`,
            suggestion: `更新事件或创建地点`,
          });
        }
      }
    }
  }

  return issues;
}

/**
 * 检查全局连续性问题（伏笔、时间线顺序等）。
 */
export function checkGlobalContinuity(): ContinuityIssue[] {
  const paths = getProjectPaths();
  const issues: ContinuityIssue[] = [];

  const plotFiles = listYamlFiles(paths.plotDir);
  const chapterIds = new Set<string>();

  for (const file of plotFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const plot = PlotSchema.parse(raw);
      for (const ch of plot.chapters) {
        chapterIds.add(ch.id);
      }

      // 检查伏笔
      for (const f of plot.foreshadowing) {
        // setupChapter 必须存在
        if (!chapterIds.has(f.setupChapter)) {
          issues.push({
            severity: "error",
            category: "foreshadowing",
            entity: f.id,
            message: `伏笔 "${f.id}" 的 setupChapter "${f.setupChapter}" 不存在`,
            suggestion: `更新伏笔的 setupChapter`,
          });
        }
        // payoffChapter 如果有，必须存在且晚于 setupChapter
        if (f.payoffChapter) {
          if (!chapterIds.has(f.payoffChapter)) {
            issues.push({
              severity: "error",
              category: "foreshadowing",
              entity: f.id,
              message: `伏笔 "${f.id}" 的 payoffChapter "${f.payoffChapter}" 不存在`,
              suggestion: `更新伏笔的 payoffChapter`,
            });
          } else {
            // 检查顺序（简化：假设章节 ID 按字母顺序递增）
            const setupIndex = plot.chapters.findIndex((ch) => ch.id === f.setupChapter);
            const payoffIndex = plot.chapters.findIndex((ch) => ch.id === f.payoffChapter);
            if (setupIndex >= payoffIndex) {
              issues.push({
                severity: "warning",
                category: "foreshadowing",
                entity: f.id,
                message: `伏笔 "${f.id}" 的 payoffChapter 在 setupChapter 之前或同时`,
                suggestion: `检查章节顺序`,
              });
            }
          }
        }
        // 长期未回收的伏笔
        if (f.status === "open" && !f.payoffChapter) {
          issues.push({
            severity: "info",
            category: "foreshadowing",
            entity: f.id,
            message: `伏笔 "${f.id}" (埋设于 ${f.setupChapter}) 尚未指定回收章节`,
            suggestion: `在故事后期章节回收此伏笔`,
          });
        }
      }
    } catch {
      continue;
    }
  }

  // 检查时间线事件顺序
  const timelineRaw = readYaml(paths.timelineYaml);
  if (timelineRaw) {
    try {
      const timeline = TimelineSchema.parse(timelineRaw);
      const eventsByChapter = new Map<string, number>();
      for (const evt of timeline.events) {
        if (evt.chapter) {
          const current = eventsByChapter.get(evt.chapter) || 0;
          eventsByChapter.set(evt.chapter, Math.max(current, evt.order));
        }
      }
      // 简化检查：同一章节的事件 order 应该唯一
      const ordersByChapter = new Map<string, Set<number>>();
      for (const evt of timeline.events) {
        if (!evt.chapter) continue;
        const orders = ordersByChapter.get(evt.chapter) || new Set();
        if (orders.has(evt.order)) {
          issues.push({
            severity: "warning",
            category: "timeline",
            entity: evt.id,
            message: `章节 ${evt.chapter} 中存在重复的 order: ${evt.order}`,
            suggestion: `调整事件的 order 值`,
          });
        }
        orders.add(evt.order);
        ordersByChapter.set(evt.chapter, orders);
      }
    } catch {
      // skip
    }
  }

  return issues;
}