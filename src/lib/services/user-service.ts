import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DrizzleDatabase } from "@/db";
import { getSession } from "auth-astro/server";

export interface CreateUserInput {
  id: string;
  email: string;
  name?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
}

/**
 * Get a user by their ID
 */
export async function getUserById(db: DrizzleDatabase, id: string) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
}

/**
 * Get a user by their email
 */
export async function getUserByEmail(db: DrizzleDatabase, email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0];
}

/**
 * Create a new user
 */
export async function createUser(db: DrizzleDatabase, input: CreateUserInput) {
  const result = await db.insert(users).values(input).returning();
  return result[0];
}

/**
 * Update an existing user
 */
export async function updateUser(
  db: DrizzleDatabase,
  id: string,
  input: UpdateUserInput
) {
  // Only update the fields that are provided in the input
  const updateData: Partial<typeof users.$inferInsert> = {};
  if (input.email !== undefined) updateData.email = input.email;
  if (input.name !== undefined) updateData.name = input.name;

  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, id))
    .returning();
  return result[0];
}

/**
 * Delete a user
 */
export async function deleteUser(db: DrizzleDatabase, id: string) {
  await db.delete(users).where(eq(users.id, id));
}

export async function findOrCreateUser(
  db: DrizzleDatabase,
  email: string,
  name: string
) {
  const user = await getUserByEmail(db, email);
  if (!user) {
    console.log(`[findOrCreateUser] User not found, creating new user`);
    return createUser(db, { id: crypto.randomUUID(), email, name });
  }
  console.log(`[findOrCreateUser] Found existing user`);
  return user;
}

export async function getCurrentUser(db: DrizzleDatabase, request: Request) {
  const session = await getSession(request);
  if (!session?.user?.email) {
    return null;
  }
  return getUserByEmail(db, session.user.email);
}
