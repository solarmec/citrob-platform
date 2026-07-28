const {
    createHmac,
    randomBytes,
    scrypt: scryptCallback,
    timingSafeEqual
} = require("node:crypto");
const { promisify } = require("node:util");
const { getHeader, isSecureRequest } = require("./http");

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "citrob_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const PASSWORD_MAX_LENGTH = 1024;

function requireSessionSecret() {
    const secret = process.env.SESSION_SECRET || "";

    if (secret.length < 32) {
        throw new Error("SESSION_SECRET debe tener al menos 32 caracteres.");
    }

    return secret;
}

function parseCookies(event) {
    const cookieHeader = getHeader(event, "cookie");
    const cookies = {};

    cookieHeader.split(";").forEach(part => {
        const separator = part.indexOf("=");
        if (separator === -1) return;

        const name = part.slice(0, separator).trim();
        const value = part.slice(separator + 1).trim();
        if (name) cookies[name] = value;
    });

    return cookies;
}

function signValue(value, secret) {
    return createHmac("sha256", secret).update(value).digest("base64url");
}

function createSessionToken(secret, now = Date.now()) {
    const issuedAt = Math.floor(now / 1000);
    const payload = Buffer.from(JSON.stringify({
        version: 1,
        issuedAt,
        expiresAt: issuedAt + SESSION_TTL_SECONDS,
        nonce: randomBytes(16).toString("base64url")
    })).toString("base64url");

    return `${payload}.${signValue(payload, secret)}`;
}

function verifySessionToken(token, secret, now = Date.now()) {
    if (typeof token !== "string") return false;

    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return false;

    const expected = Buffer.from(signValue(payload, secret));
    const received = Buffer.from(signature);

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
        return false;
    }

    try {
        const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        const nowSeconds = Math.floor(now / 1000);

        return session.version === 1 &&
            Number.isInteger(session.issuedAt) &&
            Number.isInteger(session.expiresAt) &&
            session.issuedAt <= nowSeconds + 60 &&
            session.expiresAt > nowSeconds;
    } catch {
        return false;
    }
}

function hasValidSession(event) {
    const secret = requireSessionSecret();
    const token = parseCookies(event)[SESSION_COOKIE];
    return verifySessionToken(token, secret);
}

function createSessionCookie(event) {
    const secret = requireSessionSecret();
    const token = createSessionToken(secret);
    const secure = isSecureRequest(event) ? "; Secure" : "";

    return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

function clearSessionCookie(event) {
    const secure = isSecureRequest(event) ? "; Secure" : "";
    return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

function parsePasswordHash(encodedHash) {
    const parts = String(encodedHash || "").split("$");

    if (parts.length !== 6 || parts[0] !== "scrypt") {
        throw new Error("ADMIN_PASSWORD_HASH tiene un formato inválido.");
    }

    const cost = Number(parts[1]);
    const blockSize = Number(parts[2]);
    const parallelization = Number(parts[3]);
    const salt = Buffer.from(parts[4], "base64url");
    const hash = Buffer.from(parts[5], "base64url");

    if (
        !Number.isInteger(cost) ||
        !Number.isInteger(blockSize) ||
        !Number.isInteger(parallelization) ||
        cost < 2 ** 14 ||
        blockSize < 1 ||
        parallelization < 1 ||
        salt.length < 16 ||
        hash.length < 32
    ) {
        throw new Error("ADMIN_PASSWORD_HASH contiene parámetros inválidos.");
    }

    return { cost, blockSize, parallelization, salt, hash };
}

async function verifyPassword(password, encodedHash) {
    if (
        typeof password !== "string" ||
        password.length === 0 ||
        password.length > PASSWORD_MAX_LENGTH
    ) {
        return false;
    }

    const parsed = parsePasswordHash(encodedHash);
    const derived = await scrypt(password, parsed.salt, parsed.hash.length, {
        N: parsed.cost,
        r: parsed.blockSize,
        p: parsed.parallelization,
        maxmem: 64 * 1024 * 1024
    });

    return timingSafeEqual(parsed.hash, derived);
}

async function createPasswordHash(password) {
    if (
        typeof password !== "string" ||
        password.length < 12 ||
        password.length > PASSWORD_MAX_LENGTH
    ) {
        throw new Error("La contraseña debe tener entre 12 y 1024 caracteres.");
    }

    const cost = 2 ** 14;
    const blockSize = 8;
    const parallelization = 1;
    const salt = randomBytes(16);
    const hash = await scrypt(password, salt, 64, {
        N: cost,
        r: blockSize,
        p: parallelization,
        maxmem: 64 * 1024 * 1024
    });

    return [
        "scrypt",
        cost,
        blockSize,
        parallelization,
        salt.toString("base64url"),
        hash.toString("base64url")
    ].join("$");
}

module.exports = {
    SESSION_COOKIE,
    clearSessionCookie,
    createPasswordHash,
    createSessionCookie,
    createSessionToken,
    hasValidSession,
    verifyPassword,
    verifySessionToken
};
