const { hasValidSession } = require("./_lib/auth");
const { GitHubError, getGitHubConfig, getRepositoryFile } = require("./_lib/github");
const { jsonResponse, methodNotAllowed } = require("./_lib/http");
const { validateProducts } = require("./_lib/products");

const PRODUCTS_PATH = "data/productos.json";

exports.handler = async event => {
    if (event.httpMethod !== "GET") return methodNotAllowed(["GET"]);

    try {
        if (!hasValidSession(event)) {
            return jsonResponse(401, { error: "La sesión expiró. Vuelve a ingresar." });
        }

        const file = await getRepositoryFile(PRODUCTS_PATH);
        const data = JSON.parse(file.content.toString("utf8"));
        const validation = validateProducts(data.productos);

        if (!validation.valid) {
            console.error("El catálogo remoto no superó la validación.", validation.errors);
            return jsonResponse(502, {
                error: "El catálogo almacenado en GitHub no tiene una estructura válida."
            });
        }

        return jsonResponse(200, {
            productos: data.productos,
            sha: file.sha,
            branch: getGitHubConfig().branch
        });
    } catch (error) {
        console.error("Error al leer productos desde GitHub.", error);
        const status = error instanceof GitHubError && error.statusCode === 401 ? 502 : 500;
        return jsonResponse(status, {
            error: "No fue posible obtener los productos desde GitHub."
        });
    }
};
