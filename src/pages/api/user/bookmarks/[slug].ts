import type { APIRoute } from "astro";
import { db } from "@/db";
import {
  addGiftToBookmarks,
  removeGiftFromBookmarks,
} from "@/lib/bookmark-service";
import { getGiftIdBySlug } from "@/lib/gift-service";
import { requireAuth } from "@/lib/auth-utils";

export const prerender = false;

export const PUT: APIRoute = async ({ params, locals }) => {
  const { slug } = params;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
    });
  }

  try {
    const user = await requireAuth(locals);

    const giftId = await getGiftIdBySlug(db, slug);
    if (!giftId) {
      return new Response(JSON.stringify({ error: "Gift not found" }), {
        status: 404,
      });
    }

    const bookmark = await addGiftToBookmarks(db, { userId: user.id, giftId });
    return new Response(JSON.stringify({ success: true, bookmark }), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const { slug } = params;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing slug" }), {
      status: 400,
    });
  }

  try {
    const user = await requireAuth(locals);

    const giftId = await getGiftIdBySlug(db, slug);
    if (!giftId) {
      return new Response(JSON.stringify({ error: "Gift not found" }), {
        status: 404,
      });
    }

    await removeGiftFromBookmarks(db, { userId: user.id, giftId });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    throw error;
  }
};
