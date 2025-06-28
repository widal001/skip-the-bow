import type { APIRoute } from "astro";
import { db } from "@/db";
import { getUserBookmarks } from "@/lib/bookmark-service";
import { getSession } from "auth-astro/server";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  const bookmarks = await getUserBookmarks(db, session.user.email);
  return new Response(JSON.stringify({ bookmarks }), { status: 200 });
};
