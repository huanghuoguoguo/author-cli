import { z } from "zod";

export const TimelineEventSchema = z.object({
  id: z.string(),
  chapter: z.string().default(""),
  date: z.string().default(""),
  order: z.number().default(0),
  title: z.string(),
  description: z.string().default(""),
  characters: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  consequences: z.array(z.string()).default([]),
});

export const TimelineSchema = z.object({
  events: z.array(TimelineEventSchema).default([]),
});

export type Timeline = z.infer<typeof TimelineSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

export function createDefaultTimeline(): Timeline {
  return TimelineSchema.parse({});
}

export function createDefaultTimelineEvent(id: string, title: string): TimelineEvent {
  return TimelineEventSchema.parse({ id, title });
}
