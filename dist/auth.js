import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
export async function hashPassword(password) {
    try {
        return await argon2.hash(password);
    }
    catch (err) {
        throw new Error(`Somethins is wrong when hasing the password: ${err}`);
    }
}
export async function checkPasswordHash(password, hash) {
    try {
        return await argon2.verify(hash, password);
    }
    catch (err) {
        throw new Error(`Somethins is wrong when comparing the password: ${err}`);
    }
}
export function makeJWT(userId, expiresIn, secret) {
    const payload = {
        iss: "chirpy",
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn,
    };
    return jwt.sign(payload, secret);
}
export function validateJWT(tokenString, secret) {
    try {
        const decoded = jwt.verify(tokenString, secret);
        const userId = decoded.sub?.toString();
        if (!userId)
            throw new Error("user does not exist.");
        return userId;
    }
    catch (error) {
        const errorToken = error;
        throw new Error(errorToken.message);
    }
}
export function getBearerToken(req) {
    return req.get("Authorization")?.replace("Bearer ", "") || "";
}
export function makeRereshToken() {
    return randomBytes(256).toString("hex");
}
