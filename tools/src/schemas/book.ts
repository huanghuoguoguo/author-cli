import { z } from "zod";

export const BookSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  author: z.string().default(""),  // 作者
  genre: z.string().default(""),
  status: z.enum(["planning", "ongoing", "completed", "paused", "abandoned"]).default("planning"),
  synopsis: z.string().default(""),
  style: z.string().default(""),
  tone: z.string().default(""),
  targetAudience: z.string().default(""),
  pov: z.string().default(""),
  themes: z.array(z.string()).default([]),
  writingMode: z.enum(["traditional", "webnovel", "screenplay"]).default("traditional"),
  wordCount: z.number().default(0),  // 当前字数
  chapterCount: z.number().default(0),  // 章节数
  startDate: z.string().default(""),  // 开始日期
});

export type Book = z.infer<typeof BookSchema>;

export function createDefaultBook(id: string): Book {
  return BookSchema.parse({ id });
}
