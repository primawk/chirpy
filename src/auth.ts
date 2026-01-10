import * as argon2 from "argon2";

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
