const { hasValidSession } = require("./_lib/auth");
const { GitHubError, getRepositoryFile, putRepositoryFile } = require("./_lib/github");
const {
    jsonResponse,
    methodNotAllowed,
    parseJsonBody,
    requireSameOrigin
} = require("./_lib/http");
const { validateProducts } = require("./_lib/products");

const PRODUCTS_PATH = "data/productos.json";

exports.handler = async event => {
    if (event.httpMethod !== "POST") return methodNotAllowed(["POST"]);

    const originError = requireSameOrigin(event);
    if (originError) return originError;

    try {
        if (!hasValidSession(event)) {
            return jsonResponse(401, { error: "La sesión expiró. Vuelve a ingresar." });
        }

        const body = parseJsonBody(event, 2_000_000);
        const expectedSha = body.expectedSha;
        const validation = validateProducts(body.productos);

        if (typeof expectedSha !== "string" || expectedSha.length === 0) {
            return jsonResponse(400, {
                error: "Falta la versión del catálogo. Recarga los productos antes de guardar."
            });
        }

        if (!validation.valid) {
            return jsonResponse(400, {
                error: "Hay productos con datos inválidos.",
                details: validation.errors.slice(0, 20)
            });
        }

        const currentFile = await getRepositoryFile(PRODUCTS_PATH);

        if (currentFile.sha !== expectedSha) {
            return jsonResponse(409, {
                error: "El archivo fue modificado desde otra sesión. Recarga los productos antes de guardar."
            });
        }

        const content = `${JSON.stringify({ productos: body.productos }, null, 2)}\n`;
        const result = await putRepositoryFile(
            PRODUCTS_PATH,
            Buffer.from(content, "utf8"),
            "admin: actualizar catálogo de productos",
            currentFile.sha
        );

        return jsonResponse(200, {
            message: "Los cambios fueron enviados correctamente a GitHub.",
            sha: result.content && result.content.sha,
            commitSha: result.commit && result.commit.sha
        });
    } catch (error) {
        console.error("Error al guardar productos en GitHub.", error);

        if (error.statusCode === 400 || error.statusCode === 413) {
            return jsonResponse(error.statusCode, { error: error.message });
        }

        if (error instanceof GitHubError && (error.statusCode === 409 || error.statusCode === 422)) {
            return jsonResponse(409, {
                error: "GitHub detectó un conflicto. Recarga los productos antes de volver a guardar."
            });
        }

        return jsonResponse(500, {
            error: "No fue posible guardar los cambios en GitHub."
        });
    }
};
