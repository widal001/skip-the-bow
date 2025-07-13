import type { APIRoute } from "astro";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/services/user-service";
import { getGiftIdBySlug } from "@/lib/services/gift-service";
import {
  updateGiftWishlists,
  getGiftWishlists,
} from "@/lib/services/wishlist-service";

export const prerender = false;

/**
 * Get the current wishlists for a specific gift for the current user
 *
 * GET /api/user/gifts/{giftSlug}/wishlists
 *
 * @param params - The parameters from the URL
 * @param request - The request object
 * @returns A response object
 */
export const GET: APIRoute = async ({ params, request }) => {
  // Check authentication
  const user = await getCurrentUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Validate slug parameter
  const { slug } = params;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing gift slug" }), {
      status: 400,
    });
  }

  // Get gift ID from slug
  const giftId = await getGiftIdBySlug(db, slug);
  if (!giftId) {
    return new Response(JSON.stringify({ error: "Gift not found" }), {
      status: 404,
    });
  }

  try {
    // Get current wishlist state for this gift
    const wishlistIds = await getGiftWishlists(db, {
      userId: user.id,
      giftId,
    });

    return new Response(JSON.stringify({ wishlistIds }), { status: 200 });
  } catch (error) {
    console.error("Error getting gift wishlists:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};

/**
 * Update the wishlists for a specific gift for the current user
 * Uses complete state replacement - the provided wishlistIds become the new state
 *
 * PUT /api/user/gifts/{giftSlug}/wishlists
 *
 * @param params - The parameters from the URL
 * @param request - The request object
 * @returns A response object
 */
export const PUT: APIRoute = async ({ params, request }) => {
  // Check authentication
  const user = await getCurrentUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Validate slug parameter
  const { slug } = params;
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing gift slug" }), {
      status: 400,
    });
  }

  // Get gift ID from slug
  const giftId = await getGiftIdBySlug(db, slug);
  if (!giftId) {
    return new Response(JSON.stringify({ error: "Gift not found" }), {
      status: 404,
    });
  }

  try {
    // Parse request body
    const body = await request.json();
    const { wishlistIds } = body;

    // Validate wishlistIds is an array
    if (!Array.isArray(wishlistIds)) {
      return new Response(
        JSON.stringify({
          error: "wishlistIds must be an array",
        }),
        { status: 400 }
      );
    }

    // Update the gift's wishlists
    const result = await updateGiftWishlists(db, {
      userId: user.id,
      giftId,
      wishlistIds,
    });

    return new Response(
      JSON.stringify({
        success: true,
        wishlistIds: result.wishlistIds,
        added: result.added,
        removed: result.removed,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating gift wishlists:", error);

    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400 }
      );
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
