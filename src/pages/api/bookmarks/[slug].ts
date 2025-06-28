import type { APIRoute } from "astro";
import { db } from "@/db";
import {
  addGiftToBookmarks,
  removeGiftFromBookmarks,
} from "@/lib/bookmark-service";

export const PUT: APIRoute = async ({ request }) => {
  const { userId, giftId } = await request.json();
  if (!userId || !giftId) {
    return new Response(JSON.stringify({ error: "Missing userId or giftId" }), {
      status: 400,
    });
  }
  const bookmark = await addGiftToBookmarks(db, { userId, giftId });
  return new Response(JSON.stringify({ success: true, bookmark }), {
    status: 201,
  });
};

export const DELETE: APIRoute = async ({ request }) => {
  const { userId, giftId } = await request.json();
  if (!userId || !giftId) {
    return new Response(JSON.stringify({ error: "Missing userId or giftId" }), {
      status: 400,
    });
  }
  await removeGiftFromBookmarks(db, { userId, giftId });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
