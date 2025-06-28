import type { APIRoute } from "astro";
import { db } from "@/db";
import { isGiftBookmarked } from "@/lib/services/bookmark-service";
import { getGiftIdBySlug } from "@/lib/services/gift-service";
import { getCurrentUser } from "@/lib/services/user-service";

export const prerender = false;

/**
 * Check if a gift is bookmarked by the current user
 * @param params - The parameters from the URL
 * @param request - The request object
 * @returns A response object
 */
export const GET: APIRoute = async ({ params, request }) => {
  const user = await getCurrentUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  const { slug } = params;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
    });
  }

  const giftId = await getGiftIdBySlug(db, slug);
  if (!giftId) {
    return new Response(JSON.stringify({ error: "Gift not found" }), {
      status: 404,
    });
  }

  const isBookmarked = await isGiftBookmarked(db, user.id, giftId);
  return new Response(JSON.stringify({ isBookmarked }), { status: 200 });
};
