import { join, basename } from "node:path";
import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { getProjectPaths, listYamlFiles } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { ChunkSchema, IndexSchema, createDefaultIndex } from "../schemas/rag.js";
import type { Chunk, Index } from "../schemas/rag.js";

function getIndexPath(): string {
  const paths = getProjectPaths();
  return join(paths.generatedDir, "index.yaml");
}

/**
 * 计算 text 的 content hash。
 */
function computeContentHash(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/**
 * 简单的 token 计数（中文按字符，英文按空格分词）。
 */
function estimateTokens(text: string): number {
  // 中文字符约 1 token，英文单词约 1 token
  const chineseChars = text.match(/[一-龥]/g) || [];
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  const others = text.length - chineseChars.length - (englishWords.join("").length);
  return chineseChars.length + englishWords.length + Math.ceil(others / 4);
}

/**
 * 将中文文本按自然边界切分成 chunks。
 * 目标 700 字，最小 400 字，最大 1000 字。
 */
function chunkChineseText(text: string, sourceId: string, sourceType: "chapter" | "summary", title: string, path: string): Chunk[] {
  const chunks: Chunk[] = [];
  const TARGET = 700;
  const MIN = 400;
  const MAX = 1000;

  // 按段落分割
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = "";
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // 如果当前 chunk + 这个段落超过 MAX，先保存当前 chunk
    if (currentChunk.length + trimmed.length > MAX && currentChunk.length >= MIN) {
      chunks.push(createChunk(currentChunk, sourceId, sourceType, chunkIndex, title, path));
      chunkIndex++;
      currentChunk = trimmed;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmed;
    }

    // 如果单个段落超过 MAX，需要进一步切分
    if (currentChunk.length > MAX) {
      const subChunks = splitBySentences(currentChunk, MAX, MIN);
      for (const sub of subChunks) {
        chunks.push(createChunk(sub, sourceId, sourceType, chunkIndex, title, path));
        chunkIndex++;
      }
      currentChunk = "";
    }
  }

  // 保存剩余内容
  if (currentChunk.length >= MIN) {
    chunks.push(createChunk(currentChunk, sourceId, sourceType, chunkIndex, title, path));
  } else if (chunks.length > 0 && currentChunk) {
    // 合到最后一个 chunk
    chunks[chunks.length - 1].text += "\n\n" + currentChunk;
    chunks[chunks.length - 1].tokenCount = estimateTokens(chunks[chunks.length - 1].text);
    chunks[chunks.length - 1].contentHash = computeContentHash(chunks[chunks.length - 1].text);
  }

  return chunks;
}

/**
 * 按句子切分超长文本。
 */
function splitBySentences(text: string, max: number, min: number): string[] {
  const result: string[] = [];
  // 中文句子边界：。！？； followed by optional newline
  const sentences = text.split(/([。！？；][\n]?)/);

  let current = "";
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = sentences[i] + (sentences[i + 1] || "");
    if (current.length + sentence.length > max && current.length >= min) {
      result.push(current);
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current) result.push(current);
  return result;
}

/**
 * 创建单个 chunk。
 */
function createChunk(text: string, sourceId: string, sourceType: "chapter" | "summary" | "setting", chunkIndex: number, title: string, path: string): Chunk {
  return ChunkSchema.parse({
    id: `${sourceType}-${sourceId}-chunk-${chunkIndex}`,
    sourceType,
    sourceId,
    chunkId: `chunk-${chunkIndex}`,
    title,
    path,
    text,
    tokenCount: estimateTokens(text),
    contentHash: computeContentHash(text),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * 从设定 YAML 生成 chunks（每个设定一个 chunk）。
 */
function chunkSettings(): Chunk[] {
  const paths = getProjectPaths();
  const chunks: Chunk[] = [];

  const entityDirs = [
    { dir: paths.charactersDir, type: "setting", category: "character" },
    { dir: paths.locationsDir, type: "setting", category: "location" },
    { dir: paths.worldDir, type: "setting", category: "world" },
    { dir: paths.objectsDir, type: "setting", category: "object" },
    { dir: paths.plotDir, type: "setting", category: "plot" },
    { dir: paths.rulesDir, type: "setting", category: "rules" },
  ];

  for (const { dir, type } of entityDirs) {
    const files = listYamlFiles(dir);
    for (const file of files) {
      const raw = readYaml(file);
      if (!raw) continue;
      const text = JSON.stringify(raw, null, 2);
      const sourceId = (raw as any).id || file.replace(/\.yaml$/, "");
      chunks.push(createChunk(text, sourceId, "setting", 0, `${type}/${sourceId}`, file));
    }
  }

  // book.yaml
  if (existsSync(paths.bookYaml)) {
    const raw = readYaml(paths.bookYaml);
    if (raw) {
      const text = JSON.stringify(raw, null, 2);
      chunks.push(createChunk(text, "book", "setting", 0, "setting/book", paths.bookYaml));
    }
  }

  // timeline.yaml
  if (existsSync(paths.timelineYaml)) {
    const raw = readYaml(paths.timelineYaml);
    if (raw) {
      const text = JSON.stringify(raw, null, 2);
      chunks.push(createChunk(text, "timeline", "setting", 0, "setting/timeline", paths.timelineYaml));
    }
  }

  return chunks;
}

/**
 * 从章节正文生成 chunks。
 */
function chunkChapters(): Chunk[] {
  const paths = getProjectPaths();
  const chunks: Chunk[] = [];

  if (!existsSync(paths.manuscriptDir)) return chunks;

  const volumes = readdirSync(paths.manuscriptDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(paths.manuscriptDir, d.name));

  for (const volDir of volumes) {
    const files = readdirSync(volDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => join(volDir, f));

    for (const file of files) {
      const chapterId = basename(file, ".md");
      const content = readFileSync(file, "utf-8");
      // 移除标题行
      const text = content.replace(/^#\s+.+\n/, "").trim();
      if (!text) continue;

      const chapterChunks = chunkChineseText(text, chapterId, "chapter", `chapter/${chapterId}`, file);
      chunks.push(...chapterChunks);
    }
  }

  return chunks;
}

/**
 * 重建索引。
 */
export function rebuildIndex(): { total: number; added: number; skipped: number } {
  const paths = getProjectPaths();
  const indexPath = getIndexPath();

  // 读取旧索引（如果存在）
  let oldIndex: Index | null = null;
  if (existsSync(indexPath)) {
    const raw = readYaml(indexPath);
    if (raw) {
      try {
        oldIndex = IndexSchema.parse(raw);
      } catch {
        // ignore
      }
    }
  }

  // 生成新 chunks
  const settingChunks = chunkSettings();
  const chapterChunks = chunkChapters();
  const allChunks = [...settingChunks, ...chapterChunks];

  // 基于 content hash 检查是否变化
  const oldHashes = new Map<string, string>();
  if (oldIndex) {
    for (const chunk of oldIndex.chunks) {
      oldHashes.set(chunk.id, chunk.contentHash);
    }
  }

  let added = 0;
  let skipped = 0;
  const newChunks: Chunk[] = [];

  for (const chunk of allChunks) {
    const oldHash = oldHashes.get(chunk.id);
    if (oldHash && oldHash === chunk.contentHash) {
      // 未变化，保留旧的 updatedAt
      const oldChunk = oldIndex!.chunks.find((c) => c.id === chunk.id);
      if (oldChunk) {
        newChunks.push(oldChunk);
        skipped++;
      }
    } else {
      newChunks.push(chunk);
      added++;
    }
  }

  // 写入新索引
  const newIndex = createDefaultIndex(paths.root);
  newIndex.chunks = newChunks;
  newIndex.lastRebuilt = new Date().toISOString();

  mkdirSync(paths.generatedDir, { recursive: true });
  writeYaml(indexPath, newIndex);

  return { total: newChunks.length, added, skipped };
}

/**
 * 获取索引状态。
 */
export function getIndexStatus(): { total: number; byType: Record<string, number>; lastRebuilt: string } {
  const indexPath = getIndexPath();
  if (!existsSync(indexPath)) {
    return { total: 0, byType: {}, lastRebuilt: "" };
  }

  const raw = readYaml(indexPath);
  if (!raw) return { total: 0, byType: {}, lastRebuilt: "" };

  const index = IndexSchema.parse(raw);
  const byType: Record<string, number> = {};

  for (const chunk of index.chunks) {
    byType[chunk.sourceType] = (byType[chunk.sourceType] || 0) + 1;
  }

  return {
    total: index.chunks.length,
    byType,
    lastRebuilt: index.lastRebuilt,
  };
}

/**
 * 搜索 chunks（基于关键词匹配）。
 */
export function searchChunks(query: string, limit: number = 10): Chunk[] {
  const indexPath = getIndexPath();
  if (!existsSync(indexPath)) return [];

  const raw = readYaml(indexPath);
  if (!raw) return [];

  const index = IndexSchema.parse(raw);
  const keywords = query.toLowerCase().split(/\s+/).filter((k) => k.length >= 2);

  // 简单关键词匹配
  const results: { chunk: Chunk; score: number }[] = [];

  for (const chunk of index.chunks) {
    const textLower = chunk.text.toLowerCase();
    let score = 0;

    for (const kw of keywords) {
      // 检查标题和文本
      if (chunk.title.toLowerCase().includes(kw)) score += 2;
      const matches = textLower.match(new RegExp(kw, "g")) || [];
      score += matches.length;
    }

    if (score > 0) {
      results.push({ chunk, score });
    }
  }

  // 按分数排序
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit).map((r) => r.chunk);
}