import type { APIRoute } from "astro";
import { db } from "@/db";
import {
  addGiftToBookmarks,
  removeGiftFromBookmarks,
} from "@/lib/bookmark-service";
import { getGiftIdBySlug } from "@/lib/gift-service";
import { getSession } from "auth-astro/server";
import { getCurrentUser } from "@/lib/user-service";

export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
  const user = await getCurrentUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Check if slug is provided
  const { slug } = params;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
    });
  }

  // Check if gift exists
  const giftId = await getGiftIdBySlug(db, slug);
  if (!giftId) {
    return new Response(JSON.stringify({ error: "Gift not found" }), {
      status: 404,
    });
  }

  // Add gift to bookmarks
  const bookmark = await addGiftToBookmarks(db, {
    userId: user.id,
    giftId,
  });
  return new Response(JSON.stringify({ success: true, bookmark }), {
    status: 201,
  });
};

export const DELETE: APIRoute = async ({ params, request }) => {
  const user = await getCurrentUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Check if slug is provided
  const { slug } = params;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
    });
  }

  // Check if gift exists
  const giftId = await getGiftIdBySlug(db, slug);
  if (!giftId) {
    return new Response(JSON.stringify({ error: "Gift not found" }), {
      status: 404,
    });
  }

  // Remove gift from bookmarks
  await removeGiftFromBookmarks(db, { userId: user.id, giftId });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
