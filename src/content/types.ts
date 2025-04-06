import { z } from "astro:content";

export const giftSchema = z.object({
  name: z.string(),
  description: z.string(),
  priceRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  image: z.string().optional(),
  link: z.string().url(),
  tags: z.array(z.string()),
  isHidden: z.boolean().default(false),
});

export type Gift = z.infer<typeof giftSchema> & { slug: string };
