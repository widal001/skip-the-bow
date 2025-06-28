import type { APIRoute } from "astro";
import { db } from "@/db";
import { getUserBookmarks } from "@/lib/services/bookmark-service";
import { getCurrentUser } from "@/lib/services/user-service";

export const prerender = false;

/**
 * Get all bookmarks for the current user
 * @param request - The request object
 * @returns A response object
 */
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
