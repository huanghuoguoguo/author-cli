import { z } from "zod";

export const ChapterOutlineSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  status: z.enum(["planned", "outlined", "drafted", "revised", "final"]).default("planned"),
  purpose: z.string().default(""),
  beats: z.array(z.string()).default([]),
  involvedCharacters: z.array(z.string()).default([]),
  involvedLocations: z.array(z.string()).default([]),
  unresolvedAfter: z.array(z.string()).default([]),
});

export const ForeshadowingSchema = z.object({
  id: z.string(),
  setupChapter: z.string(),
  payoffChapter: z.string().nullable().default(null),
  status: z.enum(["open", "planted", "payoff", "abandoned"]).default("open"),
  note: z.string().default(""),
});

export const PlotSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["mainline", "subplot", "arc"]).default("mainline"),
  status: z.enum(["active", "resolved", "abandoned"]).default("active"),
  mainConflict: z.string().default(""),
  currentArc: z.string().default(""),
  chapters: z.array(ChapterOutlineSchema).default([]),
  foreshadowing: z.array(ForeshadowingSchema).default([]),
});

export type Plot = z.infer<typeof PlotSchema>;
export type ChapterOutline = z.infer<typeof ChapterOutlineSchema>;
export type Foreshadowing = z.infer<typeof ForeshadowingSchema>;

export function createDefaultPlot(id: string, name: string): Plot {
  return PlotSchema.parse({ id, name });
}

export function createDefaultChapterOutline(id: string, title: string): ChapterOutline {
  return ChapterOutlineSchema.parse({ id, title });
}
