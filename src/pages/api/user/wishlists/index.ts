import type { APIRoute } from "astro";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/services/user-service";
import {
  getUserWishlists,
  createWishlist,
} from "@/lib/services/wishlist-service";

export const prerender = false;

/**
 * Get all wishlists for the current user
 *
 * GET /api/user/wishlists
 *
 * @param request - The request object
 * @returns A response object
 */
export const GET: APIRoute = async ({ request }) => {
  // Check authentication
  const user = await getCurrentUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    const wishlists = await getUserWishlists(db, user.id);
    return new Response(JSON.stringify({ wishlists }), { status: 200 });
  } catch (error) {
    console.error("Error getting user wishlists:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};

/**
 * Create a new wishlist for the current user
 *
 * POST /api/user/wishlists
 *
 * @param request - The request object
 * @returns A response object
 */
export const POST: APIRoute = async ({ request }) => {
  // Check authentication
  const user = await getCurrentUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  try {
    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || !name.trim()) {
      return new Response(
        JSON.stringify({ error: "Wishlist name is required" }),
        { status: 400 }
      );
    }

    // Create the wishlist
    const wishlist = await createWishlist(db, {
      name: name.trim(),
      description: description?.trim() || undefined,
      userId: user.id,
    });

    return new Response(JSON.stringify({ wishlist }), { status: 201 });
  } catch (error) {
    console.error("Error creating wishlist:", error);

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
