import type { MigrationConfig } from "drizzle-orm/migrator";
import { envOrSecret, envOrThrow } from "./helpers.js";
import { loadEnvFile } from "node:process";

loadEnvFile();

const databaseURL = envOrThrow("DB_URL");
const secret = envOrSecret("SECRET");

const migrationConfig: MigrationConfig = {
  migrationsFolder: "src/db",
};

type APIConfig = {
  fileserverHits: number;
  dbURL: string;
  secret: string;
};

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

type AppConfig = {
  api: APIConfig;
  db: DBConfig;
};

export const config: AppConfig = {
  api: {
    fileserverHits: 0,
    dbURL: databaseURL,
    secret: secret,
  },
  db: {
    url: databaseURL,
    migrationConfig: migrationConfig,
  },
};
