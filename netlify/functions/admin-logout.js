const { clearSessionCookie } = require("./_lib/auth");
const {
    jsonResponse,
    methodNotAllowed,
    requireSameOrigin
} = require("./_lib/http");

exports.handler = async event => {
    if (event.httpMethod !== "POST") return methodNotAllowed(["POST"]);

    const originError = requireSameOrigin(event);
    if (originError) return originError;

    return jsonResponse(
        200,
        { message: "Sesión cerrada correctamente." },
        { "Set-Cookie": clearSessionCookie(event) }
    );
};
