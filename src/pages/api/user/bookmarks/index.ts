import type { APIRoute } from "astro";
import { db } from "@/db";
import { getUserBookmarks } from "@/lib/bookmark-service";
import { requireAuth } from "@/lib/auth-utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = await requireAuth(locals);
    const bookmarks = await getUserBookmarks(db, user.id);
    return new Response(JSON.stringify({ bookmarks }), { status: 200 });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }
};
