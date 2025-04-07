import { defineCollection } from "astro:content";
import { giftSchema } from "./types";
import { file } from "astro/loaders";

const giftsCollection = defineCollection({
  loader: file("src/content/gifts/gifts.json"),
  schema: giftSchema,
});

export const collections = {
  gifts: giftsCollection,
};
