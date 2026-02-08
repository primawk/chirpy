import { db } from "../index.js";
import { refreshTokens } from "../schema.js";
import { eq, sql } from "drizzle-orm";
export async function createRefreshToken(refreshToken) {
    const [result] = await db
        .insert(refreshTokens)
        .values(refreshToken)
        .onConflictDoNothing()
        .returning();
    return result;
}
export async function getUserFromRefreshToken(refreshToken) {
    const [result] = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.token, refreshToken));
    return result;
}
export async function updateRevoke(refreshToken) {
    await db
        .update(refreshTokens)
        .set({ revokedAt: sql `NOW()` })
        .where(eq(refreshTokens.token, refreshToken));
}
