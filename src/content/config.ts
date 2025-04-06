import { defineCollection } from "astro:content";
import giftsData from "./gifts.json";
import { giftSchema } from "./types";

const ideasCollection = defineCollection({
  type: "data",
  schema: giftSchema,
});

export const collections = {
  ideas: ideasCollection,
};

// Export the gifts data for use in getCollection
export const gifts = giftsData.gifts;
