import { z } from "zod";

export const RulesSchema = z.object({
  id: z.string(),
  name: z.string(),
  priority: z.enum(["high", "medium", "low"]).default("high"),
  rules: z.array(z.string()).default([]),
  mustDo: z.array(z.string()).default([]),
  mustNotDo: z.array(z.string()).default([]),
  voice: z.string().default(""),
  dialogueRules: z.array(z.string()).default([]),
  revisionRules: z.array(z.string()).default([]),
});

export type Rules = z.infer<typeof RulesSchema>;

export function createDefaultRules(id: string, name: string): Rules {
  return RulesSchema.parse({ id, name });
}
