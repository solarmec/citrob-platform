const { hasValidSession } = require("./_lib/auth");
const { jsonResponse, methodNotAllowed } = require("./_lib/http");

exports.handler = async event => {
    if (event.httpMethod !== "GET") return methodNotAllowed(["GET"]);

    try {
        return jsonResponse(200, { authenticated: hasValidSession(event) });
    } catch (error) {
        console.error("Error al verificar la sesión administrativa.", error);
        return jsonResponse(500, {
            authenticated: false,
            error: "No fue posible verificar la sesión."
        });
    }
};
