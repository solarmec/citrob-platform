const { createSessionCookie, verifyPassword } = require("./_lib/auth");
const {
    jsonResponse,
    methodNotAllowed,
    parseJsonBody,
    requireSameOrigin
} = require("./_lib/http");

exports.handler = async event => {
    if (event.httpMethod !== "POST") return methodNotAllowed(["POST"]);

    const originError = requireSameOrigin(event);
    if (originError) return originError;

    try {
        const { password } = parseJsonBody(event, 2_000);
        const isValid = await verifyPassword(password, process.env.ADMIN_PASSWORD_HASH);

        if (!isValid) {
            return jsonResponse(401, { error: "Credenciales incorrectas." });
        }

        return jsonResponse(
            200,
            { message: "Sesión iniciada correctamente." },
            { "Set-Cookie": createSessionCookie(event) }
        );
    } catch (error) {
        console.error("Error al iniciar sesión administrativa.", error);
        return jsonResponse(
            error.statusCode || 500,
            { error: error.statusCode ? error.message : "No fue posible iniciar sesión." }
        );
    }
};
