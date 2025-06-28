import { db } from "@/db";
import { getUserByEmail } from "@/lib/user-service";

// Add type for auth locals
export interface AuthLocals {
  auth?: {
    session: () => Promise<{ user?: any } | null>;
  };
}

/**
 * Get the current authenticated user from the session
 * @param locals - The Astro locals object
 * @returns The user object or null if not authenticated
 */
export async function getCurrentUser(locals: any) {
  const session = await (locals as AuthLocals).auth?.session();
  if (!session?.user?.email) {
    return null;
  }

  const user = await getUserByEmail(db, session.user.email);
  return user;
}

/**
 * Require authentication and return the current user
 * @param locals - The Astro locals object
 * @returns The user object
 * @throws Response with 401 status if not authenticated
 */
export async function requireAuth(locals: any) {
  const user = await getCurrentUser(locals);
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
  return user;
}
