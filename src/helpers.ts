import { ForbiddenError } from "./errors.js";
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
