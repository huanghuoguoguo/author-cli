import { z } from "zod";

export const WorldSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["history", "society", "culture", "powerSystem", "geography", "technology", "religion", "economy"]).default("society"),
  description: z.string().default(""),
  rules: z.array(z.string()).default([]),
  history: z.array(z.string()).default([]),
  factions: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  notes: z.array(z.object({ chapter: z.string(), text: z.string() })).default([]),
});

export type World = z.infer<typeof WorldSchema>;

export function createDefaultWorld(id: string, name: string, category?: string): World {
  return WorldSchema.parse({ id, name, category: category ?? "society" });
}
