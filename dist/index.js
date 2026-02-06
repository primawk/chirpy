import express from "express";
import { config } from "./config.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { errorHandler, handlerCreateChirp, handlerCreateUser, handlerGetAllChirps, handlerGetChirpById, handlerLogin, handlerReadiness, handlerReqCounter, handlerResetUsers, } from "./handlers.js";
import { middlewareLogResponses, middlewareMetricsInc } from "./middlewares.js";
import { makeRereshToken } from "./auth.js";
const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);
const app = express();
const PORT = 8080;
makeRereshToken();
app.use(express.json());
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use(middlewareLogResponses);
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerReqCounter);
app.post("/admin/reset", async (req, res, next) => {
    try {
        await handlerResetUsers(req, res);
    }
    catch (error) {
        next(error);
    }
});
app.get("/api/chirps", async (req, res, next) => {
    try {
        await handlerGetAllChirps(req, res);
    }
    catch (error) {
        next(error);
    }
});
app.get("/api/chirps/:chirpID", async (req, res, next) => {
    try {
        await handlerGetChirpById(req, res);
    }
    catch (error) {
        next(error);
    }
});
app.post("/api/chirps", async (req, res, next) => {
    try {
        await handlerCreateChirp(req, res);
    }
    catch (error) {
        next(error);
    }
});
app.post("/api/users", async (req, res, next) => {
    try {
        await handlerCreateUser(req, res);
    }
    catch (error) {
        next(error);
    }
});
app.post("/api/login", async (req, res, next) => {
    try {
        await handlerLogin(req, res);
    }
    catch (error) {
        next(error);
    }
});
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
