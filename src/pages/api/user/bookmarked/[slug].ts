import type { APIRoute } from "astro";
import { db } from "@/db";
import { isGiftBookmarked } from "@/lib/bookmark-service";
import { getGiftIdBySlug } from "@/lib/gift-service";
import { getSession } from "auth-astro/server";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
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

  const isBookmarked = await isGiftBookmarked(db, session.user.email, giftId);
  return new Response(JSON.stringify({ isBookmarked }), { status: 200 });
};
