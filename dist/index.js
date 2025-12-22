import express from "express";
import { config } from "./config.js";
const app = express();
const PORT = 8080;
function handlerReadiness(req, res) {
    res.set({
        "Content-Type": "text/plain;charset=utf-8",
    });
    res.status(200).send("OK");
}
function handlerReqCounter(req, res) {
    res.set({
        "Content-Type": "text/html; charset=utf-8",
    });
    res
        .status(200)
        .send(`<html><body><h1>Welcome, Chirpy Admin</h1><p>Chirpy has been visited ${config.fileserverHits} times!</p><body></html>`);
}
function handlerResetCounter(req, res) {
    config.fileserverHits = 0;
    res.set({
        "Content-Type": "text/plain;charset=utf-8",
    });
    res.status(200).send(`Hits: ${config.fileserverHits}`);
}
function middlewareLogResponses(req, res, next) {
    res.on("finish", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
            console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`);
        }
    });
    next();
}
function middlewareMetricsInc(req, res, next) {
    res.on("finish", () => {
        config.fileserverHits++;
    });
    next();
}
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use(middlewareLogResponses);
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerReqCounter);
app.get("/admin/reset", handlerResetCounter);
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
