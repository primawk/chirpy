import express, { NextFunction } from "express";
import { Request, Response } from "express";
import { config } from "./config.js";
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
} from "./errors.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { createUser, getUser, resetUsers } from "./db/queries/users.js";
import { envOrForbidden } from "./helpers.js";
import {
  createChirp,
  getAllChirps,
  getChirpById,
} from "./db/queries/chirps.js";
import { checkPasswordHash, hashPassword } from "./auth.js";
import { NewUser } from "./db/schema.js";

const migrationClient = postgres(config.db.url, { max: 1 });
await migrate(drizzle(migrationClient), config.db.migrationConfig);

const app = express();
const PORT = 8080;

app.use(express.json());
app.use("/app", middlewareMetricsInc, express.static("./src/app"));
app.use(middlewareLogResponses);

app.get("/api/healthz", handlerReadiness);
app.get("/admin/metrics", handlerReqCounter);
app.post("/admin/reset", async (req, res, next) => {
  try {
    await handlerResetUsers(req, res);
  } catch (error) {
    next(error);
  }
});
app.get("/api/chirps", async (req, res, next) => {
  try {
    await handlerGetAllChirps(req, res);
  } catch (error) {
    next(error);
  }
});
app.get("/api/chirps/:chirpID", async (req, res, next) => {
  try {
    await handlerGetChirpById(req, res);
  } catch (error) {
    next(error);
  }
});
app.post("/api/chirps", async (req, res, next) => {
  try {
    await handlerValidate(req, res);
  } catch (error) {
    next(error);
  }
});

app.post("/api/users", async (req, res, next) => {
  try {
    await handlerCreateUser(req, res);
  } catch (error) {
    next(error);
  }
});

app.post("/api/login", async (req, res, next) => {
  try {
    await handlerLogin(req, res);
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(`There is an error: ${err}`);
  if (err instanceof NotFoundError) {
    res.status(404).send({
      error: err.message,
    });
  } else if (err instanceof BadRequestError) {
    res.status(400).send({
      error: err.message,
    });
  } else if (err instanceof UnauthorizedError) {
    res.status(401).send({
      error: err.message,
    });
  } else if (err instanceof ForbiddenError) {
    res.status(403).send({
      error: err.message,
    });
  } else {
    res.status(500).json({
      error: "Something went wrong on our end",
    });
  }
}

function handlerReadiness(req: Request, res: Response) {
  res.set({
    "Content-Type": "text/plain;charset=utf-8",
  });
  res.status(200).send("OK");
}

function handlerReqCounter(req: Request, res: Response) {
  res.set({
    "Content-Type": "text/html; charset=utf-8",
  });
  res
    .status(200)
    .send(
      `<html><body><h1>Welcome, Chirpy Admin</h1><p>Chirpy has been visited ${config.api.fileserverHits} times!</p><body></html>`
    );
}

async function handlerResetUsers(req: Request, res: Response) {
  envOrForbidden("PLATFORM");
  await resetUsers();
  res.status(200).send("Users have been reset.");
}

async function handlerValidate(req: Request, res: Response) {
  type ReqData = {
    body: string;
    userId: string;
  };

  const parsedBody: ReqData = req.body;

  if (parsedBody?.body?.length > 140) {
    throw new BadRequestError("Chirp is too long. Max length is 140");
  } else {
    const response = await createChirp(parsedBody);
    if (response) {
      res.status(201).send(response);
    } else {
      throw new Error("Failed to create the chirp.");
    }
  }
}

async function handlerGetAllChirps(req: Request, res: Response) {
  const response = await getAllChirps();
  if (response) {
    res.status(200).send(response);
  } else {
    throw new Error("Failed to get the chirps.");
  }
}

async function handlerGetChirpById(req: Request, res: Response) {
  const response = await getChirpById(req.params.chirpID);
  if (response) {
    res.status(200).send(response);
  } else {
    throw new NotFoundError("Failed to get the chirp.");
  }
}

async function handlerCreateUser(req: Request, res: Response) {
  type ResponseData = Omit<NewUser, "password">;

  const hashedPassword = await hashPassword(req.body.password);

  const parsedBody = {
    hashedPassword: hashedPassword,
    email: req.body.email,
  };

  if (!parsedBody?.email) {
    throw new BadRequestError("Email is missing");
  }
  if (!parsedBody?.hashedPassword) {
    throw new BadRequestError("Password is missing");
  }

  const response = await createUser(parsedBody);

  const responseData: ResponseData = {
    id: response.id,
    createdAt: response.createdAt,
    updatedAt: response.updatedAt,
    email: response.email,
  };

  res.status(201).send(responseData);
}

async function handlerLogin(req: Request, res: Response) {
  interface RequestData {
    password: string;
    email: string;
  }

  type ResponseData = Omit<NewUser, "hashedPassword">;

  const parsedBody: RequestData = req.body;

  if (!parsedBody?.email) {
    throw new BadRequestError("Email is missing");
  }
  if (!parsedBody?.password) {
    throw new BadRequestError("Password is missing");
  }

  const responseUser = await getUser(parsedBody.email);

  if (!responseUser) throw new BadRequestError("User not found.");

  const passwordVerification = await checkPasswordHash(
    req.body.password,
    responseUser.hashedPassword || ""
  );

  const responseData: ResponseData = {
    id: responseUser.id,
    createdAt: responseUser.createdAt,
    updatedAt: responseUser.updatedAt,
    email: responseUser.email,
  };

  if (!passwordVerification)
    throw new UnauthorizedError("Incorrect email or password");
  res.status(200).send(responseData);
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

function middlewareMetricsInc(req: Request, res: Response, next: NextFunction) {
  res.on("finish", () => {
    config.api.fileserverHits++;
  });
  next();
}

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
