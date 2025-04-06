import { defineCollection } from "astro:content";
import { giftSchema } from "./types";
import { file } from "astro/loaders";

const ideasCollection = defineCollection({
  loader: file("src/content/ideas/gifts.json"),
  schema: giftSchema,
});

export const collections = {
  ideas: ideasCollection,
};
