import { z } from "zod";

export const RelationshipSchema = z.object({
  target: z.string(),
  type: z.string(),
  status: z.enum(["active", "resolved", "dormant"]).default("active"),
  note: z.string().default(""),
});

export const CharacterNoteSchema = z.object({
  chapter: z.string(),
  text: z.string(),
});

export const CharacterArcSchema = z.object({
  currentState: z.string().default(""),
  unresolved: z.array(z.string()).default([]),
  completed: z.array(z.string()).default([]),
});

export const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  role: z.enum(["protagonist", "antagonist", "supporting", "minor", "mentioned"]).default("supporting"),
  status: z.enum(["active", "dead", "missing", "retired"]).default("active"),
  firstAppearance: z.string().default(""),
  age: z.string().default(""),
  gender: z.string().default(""),
  appearance: z.string().default(""),
  personality: z.array(z.string()).default([]),
  background: z.string().default(""),
  motivation: z.string().default(""),
  skills: z.array(z.string()).default([]),
  speechStyle: z.string().default(""),
  relationships: z.array(RelationshipSchema).default([]),
  arc: CharacterArcSchema.default({}),
  notes: z.array(CharacterNoteSchema).default([]),
});

export type Character = z.infer<typeof CharacterSchema>;
export type Relationship = z.infer<typeof RelationshipSchema>;
export type CharacterNote = z.infer<typeof CharacterNoteSchema>;

export function createDefaultCharacter(id: string, name: string, role?: string): Character {
  return CharacterSchema.parse({ id, name, role: role ?? "supporting" });
}
