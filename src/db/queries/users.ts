import e from "express";
import { db } from "../index.js";
import { NewUser, users } from "../schema.js";
import { eq } from "drizzle-orm";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function getUser(email: string) {
  const [result] = await db.select().from(users).where(eq(users.email, email));
  return result;
}

export async function resetUsers() {
  await db.delete(users);
}

export async function updateUser(
  userId: string,
  email: string,
  hashedPassword: string,
) {
  const [result] = await db
    .update(users)
    .set({ id: userId, email: email, hashedPassword: hashedPassword })
    .where(eq(users.id, userId))
    .returning();
  return result;
}
