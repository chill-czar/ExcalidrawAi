import { z } from "zod";

export const j2Shape = z.object({
  id: z.string(),
  type: z.enum(["rect", "ellipse", "arrow", "text", "line", "diamond", "free"]),
  pos: z.tuple([z.number(), z.number()]),
  size: z.tuple([z.number(), z.number()]).optional(),
  points: z.array(z.tuple([z.number(), z.number()])).optional(),
  text: z.string().optional(),
  style: z.record(z.any()).optional(),
  font: z
    .object({
      family: z.string().optional(),
      size: z.number().optional(),
      bold: z.boolean().optional(),
      italic: z.boolean().optional(),
    })
    .optional(),
});

export const j2Schema = z.array(j2Shape);
