import { z } from "zod";

export const ChunkSchema = z.object({
  id: z.string(),
  sourceType: z.enum(["setting", "chapter", "summary"]),
  sourceId: z.string(),
  chunkId: z.string(),
  title: z.string(),
  path: z.string(),
  text: z.string(),
  tokenCount: z.number().default(0),
  contentHash: z.string().default(""),
  updatedAt: z.string().default(new Date().toISOString()),
  sourceUpdatedAt: z.string().default(""),
});

export const IndexSchema = z.object({
  workId: z.string().default(""),
  chunks: z.array(ChunkSchema).default([]),
  lastRebuilt: z.string().default(""),
});

export type Chunk = z.infer<typeof ChunkSchema>;
export type Index = z.infer<typeof IndexSchema>;

export function createDefaultIndex(workId: string): Index {
  return IndexSchema.parse({ workId });
}