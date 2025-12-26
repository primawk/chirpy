import { loadEnvFile } from "node:process";
loadEnvFile();
function envOrThrow(key) {
    const value = process.env[key];
    if (!value)
        throw Error("database url is missing.");
    return value;
}
const databaseURL = envOrThrow("DB_URL");
export const config = {
    fileserverHits: 0,
    dbURL: databaseURL,
};
