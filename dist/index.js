import express from "express";
import { config } from "./config.js";
import { NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError, } from "./errors.js";
const app = express();
const PORT = 8080;
app.use(express.json());
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use(middlewareLogResponses);
app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerReqCounter);
app.post("/admin/reset", handlerResetCounter);
app.post("/api/validate_chirp", async (req, res, next) => {
    try {
        await handlerValidate(req, res);
    }
    catch (error) {
        next(error);
    }
});
app.use(errorHandler);
function errorHandler(err, req, res, next) {
    console.log(`There is an error: ${err}`);
    if (err instanceof NotFoundError) {
        res.status(404).send(err.message);
    }
    else if (err instanceof BadRequestError) {
        res.status(400).send({
            error: err.message,
        });
    }
    else if (err instanceof UnauthorizedError) {
        res.status(401).send(err.message);
    }
    else if (err instanceof ForbiddenError) {
        res.status(403).send(err.message);
    }
    else {
        res.status(500).json({
            error: "Something went wrong on our end",
        });
    }
}
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
async function handlerValidate(req, res) {
    function censorText(input, restrictedWords) {
        let result = input;
        for (const word of restrictedWords) {
            const regex = new RegExp(`\\b${word}\\b`, "gi");
            result = result.replace(regex, "****");
        }
        return result;
    }
    const parsedBody = req.body;
    if (parsedBody?.body?.length > 140) {
        throw new BadRequestError("Chirp is too long. Max length is 140");
    }
    else {
        res.status(200).send({
            cleanedBody: censorText(parsedBody?.body, [
                "kerfuffle",
                "sharbert",
                "fornax",
            ]),
        });
    }
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
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
