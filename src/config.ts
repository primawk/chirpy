import { loadEnvFile } from "node:process";

loadEnvFile();

function envOrThrow(key: string) {
  const value = process.env[key];

  if (!value) throw Error("database url is missing.");
  return value;
}

const databaseURL = envOrThrow("DB_URL");

type APIConfig = {
  fileserverHits: number;
  dbURL: string;
};

export const config: APIConfig = {
  fileserverHits: 0,
  dbURL: databaseURL,
};
