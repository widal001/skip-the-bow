import type { Gift } from "../content/types";
import { gifts } from "../content/config";

export async function getGiftIdeas(): Promise<Gift[]> {
  return gifts;
}

export async function getGiftBySlug(slug: string): Promise<Gift | undefined> {
  return gifts.find((gift) => gift.slug === slug);
}
