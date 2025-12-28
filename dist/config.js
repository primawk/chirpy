import { envOrThrow } from "./helpers.js";
const databaseURL = envOrThrow("DB_URL");
const migrationConfig = {
    migrationsFolder: "src/db",
};
export const config = {
    api: {
        fileserverHits: 0,
        dbURL: databaseURL,
    },
    db: {
        url: databaseURL,
        migrationConfig: migrationConfig,
    },
};
