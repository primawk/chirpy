import { db } from "../index.js";
import { chirps } from "../schema.js";
import { eq } from "drizzle-orm";
export async function createChirp(chirp) {
    const [result] = await db
        .insert(chirps)
        .values(chirp)
        .onConflictDoNothing()
        .returning();
    return result;
}
export async function getAllChirps(authorId) {
    const results = authorId
        ? await db.select().from(chirps).where(eq(chirps.userId, authorId))
        : await db.select().from(chirps);
    return results;
}
export async function getChirpById(id) {
    const [result] = await db.select().from(chirps).where(eq(chirps.id, id));
    return result;
}
export async function getChirpByUserId(userId) {
    const [result] = await db
        .select()
        .from(chirps)
        .where(eq(chirps.userId, userId));
    return result;
}
export async function deleteChirp(chirpId) {
    await db.delete(chirps).where(eq(chirps.id, chirpId));
}
