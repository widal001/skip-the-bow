import type { APIRoute } from "astro";
import { db } from "@/db";
import { isGiftBookmarked } from "@/lib/bookmark-service";
import { getGiftIdBySlug } from "@/lib/gift-service";
import { getCurrentUser } from "@/lib/user-service";

export const prerender = false;

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
