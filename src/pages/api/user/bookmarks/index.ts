import type { APIRoute } from "astro";
import { db } from "@/db";
import { getUserBookmarks } from "@/lib/bookmark-service";
import { getCurrentUser } from "@/lib/user-service";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const user = await getCurrentUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }
  const bookmarks = await getUserBookmarks(db, user.id);
  return new Response(JSON.stringify({ bookmarks }), { status: 200 });
};
