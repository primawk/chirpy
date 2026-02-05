import { envOrSecret, envOrThrow } from "./helpers.js";
import { loadEnvFile } from "node:process";
loadEnvFile();
const databaseURL = envOrThrow("DB_URL");
const secret = envOrSecret("SECRET");
const migrationConfig = {
    migrationsFolder: "src/db",
};
export const config = {
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
