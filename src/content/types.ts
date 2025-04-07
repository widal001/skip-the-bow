import { z } from "astro:content";

export const GiftCategory = z.enum([
  "donation",
  "subscription",
  "experience",
  "giftcard",
  "other",
]);

export type GiftCategory = z.infer<typeof GiftCategory>;

export const giftSchema = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  priceRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  link: z.string().url(),
  tags: z.array(z.string()),
  isHidden: z.boolean().default(false),
  category: GiftCategory,
});

export type Gift = z.infer<typeof giftSchema>;
