import { z } from "zod";

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  language: z.string().default("zh-CN"),
  writingMode: z.enum(["traditional", "webnovel", "screenplay"]).default("traditional"),
  currentChapter: z.string().default(""),
  manuscriptDir: z.string().default("manuscript"),
  canonDir: z.string().default("canon"),
  generatedDir: z.string().default("generated"),
  defaultContext: z.object({
    previousChapterCount: z.number().default(2),
    includeFullCurrentChapter: z.boolean().default(false),
    currentChapterWindowChars: z.number().default(5000),
  }).default({}),
});

export type Project = z.infer<typeof ProjectSchema>;

export function createDefaultProject(id: string): Project {
  return ProjectSchema.parse({ id });
}
