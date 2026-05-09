import { z } from "zod";

export const ObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["clue", "weapon", "artifact", "document", "key", "symbol", "other"]).default("other"),
  status: z.enum(["active", "destroyed", "lost", "hidden"]).default("active"),
  description: z.string().default(""),
  currentHolder: z.string().default(""),
  firstAppearance: z.string().default(""),
  symbolism: z.string().default(""),
  rules: z.array(z.string()).default([]),
  relatedPlot: z.array(z.string()).default([]),
  notes: z.array(z.object({ chapter: z.string(), text: z.string() })).default([]),
});

export type NovelObject = z.infer<typeof ObjectSchema>;

export function createDefaultObject(id: string, name: string, type?: string): NovelObject {
  return ObjectSchema.parse({ id, name, type: type ?? "other" });
}
