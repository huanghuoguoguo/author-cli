import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { parse, stringify } from "yaml";

/**
 * 读取 YAML 文件并解析为对象。
 * 文件不存在时返回 null。
 */
export function readYaml<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, "utf-8");
  return parse(content) as T;
}

/**
 * 将对象写入 YAML 文件。
 * 使用固定的字段顺序和格式化选项。
 */
export function writeYaml(filePath: string, data: unknown): void {
  const content = stringify(data, {
    indent: 2,
    lineWidth: 120,
    defaultKeyType: "PLAIN",
    defaultStringType: "QUOTE_DOUBLE",
  });
  writeFileSync(filePath, content, "utf-8");
}

/**
 * 读取 YAML 文件，用 schema 解析并返回。
 * 用于确保数据符合 schema。
 */
export function readAndParseYaml<T>(filePath: string, schema: { parse: (data: unknown) => T }): T | null {
  const raw = readYaml(filePath);
  if (raw === null) return null;
  return schema.parse(raw);
}
