import { db } from "..";
import { RefreshToken, refreshTokens } from "../schema";
import { eq, sql } from "drizzle-orm";

export async function createRefreshToken(refreshToken: RefreshToken) {
  const [result] = await db
    .insert(refreshTokens)
    .values(refreshToken)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function getUserFromRefreshToken(refreshToken: string) {
  const [result] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, refreshToken));
  return result;
}

export async function updateRevoke(refreshToken: string) {
   await db
    .update(refreshTokens)
    .set({ revokedAt: sql`NOW()` })
    .where(eq(refreshTokens.token, refreshToken));
}
