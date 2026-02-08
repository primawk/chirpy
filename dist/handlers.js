import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError, } from "./errors.js";
import { envOrForbidden } from "./helpers.js";
import { createUser, getUser, resetUsers } from "./db/queries/users.js";
import { checkPasswordHash, getBearerToken, hashPassword, makeJWT, makeRereshToken, validateJWT, } from "./auth.js";
import { config } from "./config.js";
import { createChirp, getAllChirps, getChirpById, } from "./db/queries/chirps.js";
import { createRefreshToken, getUserFromRefreshToken, updateRevoke, } from "./db/queries/refreshTokens.js";
export function errorHandler(err, req, res, next) {
    console.log(`There is an error: ${err}`);
    if (err instanceof NotFoundError) {
        res.status(404).send({
            error: err.message,
        });
    }
    else if (err instanceof BadRequestError) {
        res.status(400).send({
            error: err.message,
        });
    }
    else if (err instanceof UnauthorizedError) {
        res.status(401).send({
            error: err.message,
        });
    }
    else if (err instanceof ForbiddenError) {
        res.status(403).send({
            error: err.message,
        });
    }
    else {
        res.status(500).json({
            error: "Something went wrong on our end",
        });
    }
}
export function handlerReadiness(req, res) {
    res.set({
        "Content-Type": "text/plain;charset=utf-8",
    });
    res.status(200).send("OK");
}
export function handlerReqCounter(req, res) {
    res.set({
        "Content-Type": "text/html; charset=utf-8",
    });
    res
        .status(200)
        .send(`<html><body><h1>Welcome, Chirpy Admin</h1><p>Chirpy has been visited ${config.api.fileserverHits} times!</p><body></html>`);
}
export async function handlerResetUsers(req, res) {
    envOrForbidden("PLATFORM");
    await resetUsers();
    res.status(200).send("Users have been reset.");
}
export async function handlerCreateChirp(req, res) {
    const token = getBearerToken(req);
    const isAuthUserId = validateJWT(token, config.api.secret);
    const parsedBody = { body: req.body.body, userId: isAuthUserId };
    if (parsedBody?.body?.length > 140) {
        throw new BadRequestError("Chirp is too long. Max length is 140");
    }
    else {
        const response = await createChirp(parsedBody);
        if (response) {
            res.status(201).send(response);
        }
        else {
            throw new Error("Failed to create the chirp.");
        }
    }
}
export async function handlerGetAllChirps(req, res) {
    const response = await getAllChirps();
    if (response) {
        res.status(200).send(response);
    }
    else {
        throw new Error("Failed to get the chirps.");
    }
}
export async function handlerGetChirpById(req, res) {
    const response = await getChirpById(req.params.chirpID);
    if (response) {
        res.status(200).send(response);
    }
    else {
        throw new NotFoundError("Failed to get the chirp.");
    }
}
export async function handlerCreateUser(req, res) {
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
    const responseData = {
        id: response.id,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        email: response.email,
    };
    res.status(201).send(responseData);
}
export async function handlerLogin(req, res) {
    const parsedBody = req.body;
    if (!parsedBody?.email) {
        throw new BadRequestError("Email is missing");
    }
    if (!parsedBody?.password) {
        throw new BadRequestError("Password is missing");
    }
    // if (!parsedBody?.expiresInSeconds || parsedBody?.expiresInSeconds > 3600) {
    //   parsedBody.expiresInSeconds = 3600;
    // }
    const responseUser = await getUser(parsedBody.email);
    if (!responseUser)
        throw new BadRequestError("User not found.");
    const passwordVerification = await checkPasswordHash(req.body.password, responseUser.hashedPassword || "");
    const refreshToken = makeRereshToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);
    const refreshTokenPayload = {
        userId: responseUser.id,
        token: refreshToken,
        expiresAt: expiresAt,
        revokedAt: null,
    };
    const postRefreshToken = await createRefreshToken(refreshTokenPayload);
    if (!postRefreshToken)
        throw new Error("There is something wrong when posting the refresh token.");
    const responseData = {
        id: responseUser.id,
        createdAt: responseUser.createdAt,
        updatedAt: responseUser.updatedAt,
        email: responseUser.email,
        token: makeJWT(responseUser.id, 3600, config.api.secret),
        refreshToken: postRefreshToken?.token,
    };
    if (!passwordVerification)
        throw new UnauthorizedError("Incorrect email or password");
    res.status(200).send(responseData);
}
export async function handlerCreateRefreshToken(req, res) {
    const responseGetUserId = await getUserFromRefreshToken(getBearerToken(req));
    const responseData = {
        token: makeJWT(responseGetUserId.userId, 3600, config.api.secret),
    };
    if (!responseGetUserId || responseGetUserId?.revokedAt)
        throw new UnauthorizedError("Unauthorized user.");
    res.status(200).send(responseData);
}
export async function handlerRevokeRefreshToken(req, res) {
    const responseGetUserId = await getUserFromRefreshToken(getBearerToken(req));
    if (!responseGetUserId || responseGetUserId?.revokedAt)
        throw new Error("user not found.");
    await updateRevoke(responseGetUserId?.token);
    res.status(204).send("Refresh token has been revoked.");
}
