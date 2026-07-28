const DEFAULT_HEADERS = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Referrer-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
};

function jsonResponse(statusCode, payload, headers = {}) {
    return {
        statusCode,
        headers: {
            ...DEFAULT_HEADERS,
            ...headers
        },
        body: JSON.stringify(payload)
    };
}

function methodNotAllowed(allowedMethods) {
    return jsonResponse(
        405,
        { error: "Método no permitido." },
        { Allow: allowedMethods.join(", ") }
    );
}

function getHeader(event, name) {
    const headers = event.headers || {};
    const wanted = name.toLowerCase();

    for (const [key, value] of Object.entries(headers)) {
        if (key.toLowerCase() === wanted) return value;
    }

    return "";
}

function parseJsonBody(event, maxCharacters = 5_000_000) {
    const rawBody = event.isBase64Encoded
        ? Buffer.from(event.body || "", "base64").toString("utf8")
        : event.body || "";

    if (rawBody.length > maxCharacters) {
        const error = new Error("La solicitud supera el tamaño permitido.");
        error.statusCode = 413;
        throw error;
    }

    try {
        return JSON.parse(rawBody);
    } catch {
        const error = new Error("La solicitud no contiene JSON válido.");
        error.statusCode = 400;
        throw error;
    }
}

function isSameOrigin(event) {
    const origin = getHeader(event, "origin");
    const forwardedHost = getHeader(event, "x-forwarded-host");
    const host = (forwardedHost || getHeader(event, "host")).split(",")[0].trim();
    const forwardedProtocol = getHeader(event, "x-forwarded-proto")
        .split(",")[0]
        .trim()
        .toLowerCase();

    if (!origin || !host) return false;

    try {
        const originUrl = new URL(origin);
        const sameHost = originUrl.host.toLowerCase() === host.toLowerCase();
        const sameProtocol = !forwardedProtocol ||
            originUrl.protocol === `${forwardedProtocol}:`;
        return sameHost && sameProtocol;
    } catch {
        return false;
    }
}

function requireSameOrigin(event) {
    if (isSameOrigin(event)) return null;
    return jsonResponse(403, { error: "Origen de solicitud no permitido." });
}

function isSecureRequest(event) {
    const protocol = getHeader(event, "x-forwarded-proto").split(",")[0].trim();
    if (protocol) return protocol === "https";

    const host = getHeader(event, "host");
    return !host.startsWith("localhost") && !host.startsWith("127.0.0.1");
}

module.exports = {
    getHeader,
    isSecureRequest,
    jsonResponse,
    methodNotAllowed,
    parseJsonBody,
    requireSameOrigin
};
