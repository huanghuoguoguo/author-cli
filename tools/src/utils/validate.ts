import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getProjectPaths, listYamlFiles, readProject } from "./paths.js";
import { readYaml } from "./yaml.js";
import { CharacterSchema, BookSchema, LocationSchema, WorldSchema, ObjectSchema, PlotSchema, RulesSchema, TimelineSchema } from "../schemas/index.js";

export interface ValidationError {
  file: string;
  field?: string;
  message: string;
}

/**
 * 校验整个项目。
 * 返回错误列表，空数组表示通过。
 */
export function validateProject(rootDir?: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const paths = getProjectPaths(rootDir);

  // 1. 校验 project.yaml
  const project = readProject(paths.root);
  if (!project) {
    errors.push({ file: "project.yaml", message: "project.yaml 不存在或无法解析" });
    return errors; // 没有 project 就无法继续
  }

  // 2. 校验 book.yaml
  const bookPath = paths.bookYaml;
  if (existsSync(bookPath)) {
    try {
      const raw = readYaml(bookPath);
      BookSchema.parse(raw);
    } catch (e: any) {
      errors.push({ file: "canon/book.yaml", message: `schema 校验失败: ${e.message}` });
    }
  }

  // 3. 校验角色
  const characterFiles = listYamlFiles(paths.charactersDir);
  const characterIds = new Set<string>();
  for (const file of characterFiles) {
    try {
      const raw = readYaml(file);
      const parsed = CharacterSchema.parse(raw);
      if (characterIds.has(parsed.id)) {
        errors.push({ file, message: `角色 ID 重复: ${parsed.id}` });
      }
      characterIds.add(parsed.id);
      // 检查 id 和文件名一致
      const expectedFile = join(paths.charactersDir, `${parsed.id}.yaml`);
      if (file !== expectedFile) {
        errors.push({ file, field: "id", message: `角色 ID (${parsed.id}) 与文件名不匹配` });
      }
    } catch (e: any) {
      errors.push({ file, message: `schema 校验失败: ${e.message}` });
    }
  }

  // 4. 校验地点
  const locationFiles = listYamlFiles(paths.locationsDir);
  const locationIds = new Set<string>();
  for (const file of locationFiles) {
    try {
      const raw = readYaml(file);
      const parsed = LocationSchema.parse(raw);
      if (locationIds.has(parsed.id)) {
        errors.push({ file, message: `地点 ID 重复: ${parsed.id}` });
      }
      locationIds.add(parsed.id);
    } catch (e: any) {
      errors.push({ file, message: `schema 校验失败: ${e.message}` });
    }
  }

  // 5. 校验世界观
  const worldFiles = listYamlFiles(paths.worldDir);
  const worldIds = new Set<string>();
  for (const file of worldFiles) {
    try {
      const raw = readYaml(file);
      const parsed = WorldSchema.parse(raw);
      if (worldIds.has(parsed.id)) {
        errors.push({ file, message: `世界观 ID 重复: ${parsed.id}` });
      }
      worldIds.add(parsed.id);
    } catch (e: any) {
      errors.push({ file, message: `schema 校验失败: ${e.message}` });
    }
  }

  // 6. 校验物品
  const objectFiles = listYamlFiles(paths.objectsDir);
  const objectIds = new Set<string>();
  for (const file of objectFiles) {
    try {
      const raw = readYaml(file);
      const parsed = ObjectSchema.parse(raw);
      if (objectIds.has(parsed.id)) {
        errors.push({ file, message: `物品 ID 重复: ${parsed.id}` });
      }
      objectIds.add(parsed.id);
    } catch (e: any) {
      errors.push({ file, message: `schema 校验失败: ${e.message}` });
    }
  }

  // 7. 校验大纲
  const plotFiles = listYamlFiles(paths.plotDir);
  const plotIds = new Set<string>();
  for (const file of plotFiles) {
    try {
      const raw = readYaml(file);
      const parsed = PlotSchema.parse(raw);
      if (plotIds.has(parsed.id)) {
        errors.push({ file, message: `大纲 ID 重复: ${parsed.id}` });
      }
      plotIds.add(parsed.id);
    } catch (e: any) {
      errors.push({ file, message: `schema 校验失败: ${e.message}` });
    }
  }

  // 8. 校验写作规则
  const rulesFiles = listYamlFiles(paths.rulesDir);
  for (const file of rulesFiles) {
    try {
      const raw = readYaml(file);
      RulesSchema.parse(raw);
    } catch (e: any) {
      errors.push({ file, message: `schema 校验失败: ${e.message}` });
    }
  }

  // 9. 校验时间线
  if (existsSync(paths.timelineYaml)) {
    try {
      const raw = readYaml(paths.timelineYaml);
      TimelineSchema.parse(raw);
    } catch (e: any) {
      errors.push({ file: "canon/timeline.yaml", message: `schema 校验失败: ${e.message}` });
    }
  }

  // 10. 跨引用校验：角色关系 target 必须存在
  for (const file of characterFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const parsed = CharacterSchema.parse(raw);
      for (const rel of parsed.relationships) {
        if (!characterIds.has(rel.target)) {
          errors.push({
            file,
            field: `relationships.target=${rel.target}`,
            message: `关系目标角色不存在: ${rel.target}`,
          });
        }
      }
      // 检查 firstAppearance 引用
      if (parsed.firstAppearance && !chapterExists(paths, parsed.firstAppearance)) {
        // 这是警告，不是错误，因为章节可能还没写
      }
    } catch {
      // schema 校验已经报过了
    }
  }

  return errors;
}

/**
 * 检查章节是否存在（在大纲或 manuscript 中）。
 */
function chapterExists(paths: ReturnType<typeof getProjectPaths>, chapterId: string): boolean {
  // 检查大纲中
  const plotFiles = listYamlFiles(paths.plotDir);
  for (const file of plotFiles) {
    const raw = readYaml(file);
    if (!raw) continue;
    try {
      const parsed = PlotSchema.parse(raw);
      if (parsed.chapters.some((ch) => ch.id === chapterId)) return true;
    } catch {
      continue;
    }
  }

  // 检查 manuscript 中
  const volumeDirs = existsSync(paths.manuscriptDir)
    ? readdirSync(paths.manuscriptDir, { withFileTypes: true })
        .filter((d: any) => d.isDirectory())
        .map((d: any) => join(paths.manuscriptDir, d.name))
    : [];

  for (const volDir of volumeDirs) {
    if (existsSync(join(volDir, `${chapterId}.md`))) return true;
  }

  return false;
}
