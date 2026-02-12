import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError, } from "./errors.js";
import { envOrForbidden } from "./helpers.js";
import { createUser, getUser, resetUsers, updateUser, upgradeUser, } from "./db/queries/users.js";
import { checkPasswordHash, getBearerToken, hashPassword, makeJWT, makeRereshToken, validateJWT, } from "./auth.js";
import { config } from "./config.js";
import { createChirp, deleteChirp, getAllChirps, getChirpById, getChirpByUserId, } from "./db/queries/chirps.js";
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
    const accessToken = getBearerToken(req);
    const isAuthUserId = validateJWT(accessToken, config.api.secret);
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
        isChirpyRed: response.isChirpyRed,
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
        isChirpyRed: responseUser.isChirpyRed,
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
export async function handlerUpdateUser(req, res) {
    const accessToken = getBearerToken(req);
    const isAuthUserId = validateJWT(accessToken, config.api.secret);
    const parsedBody = req.body;
    if (!parsedBody?.email) {
        throw new BadRequestError("Email is missing");
    }
    if (!parsedBody?.password) {
        throw new BadRequestError("Password is missing");
    }
    const hashedPassword = await hashPassword(parsedBody.password);
    const response = await updateUser(isAuthUserId, parsedBody.email, hashedPassword);
    const responseData = {
        id: response.id,
        email: response.email,
        isChirpyRed: response.isChirpyRed,
    };
    res.status(200).send(responseData);
}
export async function handlerDeleteChirp(req, res) {
    const accessToken = getBearerToken(req);
    const isAuthUserId = validateJWT(accessToken, config.api.secret);
    const responseChirp = await getChirpByUserId(isAuthUserId);
    if (responseChirp?.id !== req.params.chirpId)
        throw new ForbiddenError("You are forbidden to delete this chirp.");
    try {
        await deleteChirp(req.params.chirpId);
    }
    catch (error) {
        throw new NotFoundError("Chirp is not found.");
    }
    res.status(204).send("Chirp is successfully deleted.");
}
export async function handlerUpgradeUser(req, res) {
    const parsedBody = req.body;
    if (parsedBody?.event === "user.upgraded") {
        const response = await upgradeUser(parsedBody?.data?.userId);
        if (!response)
            throw new NotFoundError("failed to upgrade the user.");
        res.status(204).send("user upgraded.");
    }
    else {
        res.status(204).send("user is not eligible.");
    }
}
