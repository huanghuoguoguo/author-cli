import { z } from "zod";

export const ProposalSuggestionSchema = z.object({
  action: z.enum(["append", "update", "create"]),
  entityType: z.enum(["character", "location", "world", "object", "plot", "timeline", "rules"]),
  entityId: z.string(),
  field: z.string().optional(),
  value: z.any(),
  reason: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0.5),
});

export const ProposalSchema = z.object({
  id: z.string(),
  sourceChapter: z.string(),
  status: z.enum(["pending", "applied", "rejected"]).default("pending"),
  createdAt: z.string(),
  suggestions: z.array(ProposalSuggestionSchema).default([]),
});

export type Proposal = z.infer<typeof ProposalSchema>;
export type ProposalSuggestion = z.infer<typeof ProposalSuggestionSchema>;

export function createDefaultProposal(id: string, sourceChapter: string): Proposal {
  return ProposalSchema.parse({
    id,
    sourceChapter,
    createdAt: new Date().toISOString(),
  });
}
