import { ForbiddenError, UnauthorizedError } from "./errors.js";
import { loadEnvFile } from "node:process";

loadEnvFile();

export function envOrThrow(key: string) {
  const value = process.env[key];

  if (!value) throw Error("database url is missing.");
  return value;
}

export function envOrForbidden(key: string) {
  const value = process.env[key];

  if (!value) throw new ForbiddenError("This endpoint is forbidden.");
  return value;
}

export function envOrSecret(key: string) {
  const value = process.env[key];

  if (!value) throw new ForbiddenError("Secret is empty.");
  return value;
}

export function envOrPolka(key: string) {
  const value = process.env[key];

  if (!value) throw new UnauthorizedError("You are not authorized.");
  return value;
}
