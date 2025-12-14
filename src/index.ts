import express, { NextFunction } from "express";
import { Request, Response } from "express";

const app = express();
const PORT = 8080;

function handlerReadiness(req: Request, res: Response) {
  res.set({
    "Content-Type": "text/plain;charset=utf-8",
  });
  res.status(200).send("OK");
}

function middlewareLogResponses(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.log(
        `[NON-OK] ${req.method} ${req.url} - Status: ${res.statusCode}`
      );
    }
  });
  next();
}

app.use("/app", express.static("./src/app"));
app.use(middlewareLogResponses);
app.get("/healthz", handlerReadiness);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
