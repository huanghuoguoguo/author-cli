import { resolve, join } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { readYaml } from "./yaml.js";
import type { Project } from "../schemas/project.js";

/**
 * 从当前目录向上查找 project.yaml，返回项目根目录。
 * 如果找不到，返回当前工作目录。
 */
export function findProjectRoot(startDir: string = process.cwd()): string {
  let dir = resolve(startDir);
  while (true) {
    if (existsSync(join(dir, "project.yaml"))) {
      return dir;
    }
    const parent = resolve(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(startDir);
}

/**
 * 读取 project.yaml 配置。
 */
export function readProject(rootDir?: string): Project | null {
  const root = rootDir ?? findProjectRoot();
  const projectPath = join(root, "project.yaml");
  return readYaml<Project>(projectPath);
}

/**
 * 获取项目各目录的绝对路径。
 */
export function getProjectPaths(rootDir?: string) {
  const root = rootDir ?? findProjectRoot();
  const project = readProject(root);

  const canonDir = join(root, project?.canonDir ?? "canon");
  const manuscriptDir = join(root, project?.manuscriptDir ?? "manuscript");
  const generatedDir = join(root, project?.generatedDir ?? "generated");
  const proposalsDir = join(root, "proposals");

  return {
    root,
    canonDir,
    manuscriptDir,
    generatedDir,
    proposalsDir,
    // canon 子目录
    charactersDir: join(canonDir, "characters"),
    locationsDir: join(canonDir, "locations"),
    worldDir: join(canonDir, "world"),
    objectsDir: join(canonDir, "objects"),
    plotDir: join(canonDir, "plot"),
    rulesDir: join(canonDir, "rules"),
    // 文件
    bookYaml: join(canonDir, "book.yaml"),
    timelineYaml: join(canonDir, "timeline.yaml"),
  };
}

/**
 * 列出目录下所有 .yaml 文件（不含子目录）。
 */
export function listYamlFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
    .map((f) => join(dirPath, f));
}

/**
 * 列出目录下所有 .md 文件（不含子目录）。
 */
export function listMdFiles(dirPath: string): string[] {
  if (!existsSync(dirPath)) return [];
  return readdirSync(dirPath)
    .filter((f) => f.endsWith(".md"))
    .map((f) => join(dirPath, f));
}
