import * as argon2 from "argon2";
import jwt, { JwtPayload } from "jsonwebtoken";

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

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

function makeJWT(userId: string, expiresIn: number, secret: string): string {
  const payload: payload = {
    iss: "chirpy",
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };

  return jwt.sign(payload, secret);
}
