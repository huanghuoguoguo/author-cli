import { z } from "zod";

export const BookSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  genre: z.string().default(""),
  synopsis: z.string().default(""),
  style: z.string().default(""),
  tone: z.string().default(""),
  targetAudience: z.string().default(""),
  pov: z.string().default(""),
  themes: z.array(z.string()).default([]),
  writingMode: z.enum(["traditional", "webnovel", "screenplay"]).default("traditional"),
});

export type Book = z.infer<typeof BookSchema>;

export function createDefaultBook(id: string): Book {
  return BookSchema.parse({ id });
}
