import type { MigrationConfig } from "drizzle-orm/migrator";
import { envOrPolka, envOrSecret, envOrThrow } from "./helpers.js";
import { loadEnvFile } from "node:process";

loadEnvFile();

const databaseURL = envOrThrow("DB_URL");
const secret = envOrSecret("SECRET");
const polkaSecret = envOrPolka("POLKA_KEY");

const migrationConfig: MigrationConfig = {
  migrationsFolder: "src/db",
};

type APIConfig = {
  fileserverHits: number;
  dbURL: string;
  secret: string;
  polkaSecret: string;
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
    polkaSecret: polkaSecret,
  },
  db: {
    url: databaseURL,
    migrationConfig: migrationConfig,
  },
};
