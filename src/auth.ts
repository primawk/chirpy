import * as argon2 from "argon2";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request } from "express";

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

type ErrorToken = {
  name: string;
  message: string;
  expiredAt: number;
};

export async function hashPassword(password: string) {
  try {
    return await argon2.hash(password);
  } catch (err) {
    throw new Error(`Somethins is wrong when hasing the password: ${err}`);
  }
}

export async function checkPasswordHash(password: string, hash: string) {
  try {
    return await argon2.verify(hash, password);
  } catch (err) {
    throw new Error(`Somethins is wrong when comparing the password: ${err}`);
  }
}

export function makeJWT(
  userId: string,
  expiresIn: number,
  secret: string,
): string {
  const payload: payload = {
    iss: "chirpy",
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };
  return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
  try {
    const decoded = jwt.verify(tokenString, secret);
    const userId = decoded.sub?.toString();
    if (!userId) throw new Error("user does not exist.");
    return userId;
  } catch (error) {
    const errorToken = error as ErrorToken;
    throw new Error(errorToken.message);
  }
}

export function getBearerToken(req: Request): string {
  return req.get("Authorization")?.replace("Bearer ", "") || "";
}
