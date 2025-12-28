import type { MigrationConfig } from "drizzle-orm/migrator";
import { envOrThrow } from "./helpers.js";

const databaseURL = envOrThrow("DB_URL");

const migrationConfig: MigrationConfig = {
  migrationsFolder: "src/db",
};

type APIConfig = {
  fileserverHits: number;
  dbURL: string;
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
  },
  db: {
    url: databaseURL,
    migrationConfig: migrationConfig,
  },
};
