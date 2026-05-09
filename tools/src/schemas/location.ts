import { z } from "zod";

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().default(""),
  status: z.enum(["active", "destroyed", "abandoned"]).default("active"),
  description: z.string().default(""),
  visual: z.string().default(""),
  audio: z.string().default(""),
  smellTouch: z.string().default(""),
  mood: z.string().default(""),
  rules: z.array(z.string()).default([]),
  connectedCharacters: z.array(z.string()).default([]),
  usedInChapters: z.array(z.string()).default([]),
  notes: z.array(z.object({ chapter: z.string(), text: z.string() })).default([]),
});

export type Location = z.infer<typeof LocationSchema>;

export function createDefaultLocation(id: string, name: string): Location {
  return LocationSchema.parse({ id, name });
}
