const { randomBytes } = require("node:crypto");
const { hasValidSession } = require("./_lib/auth");
const { GitHubError, putRepositoryFile } = require("./_lib/github");
const {
    jsonResponse,
    methodNotAllowed,
    parseJsonBody,
    requireSameOrigin
} = require("./_lib/http");

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const UPLOAD_DIRECTORY = "imagenes/uploads";
const ALLOWED_IMAGES = {
    "image/jpeg": {
        extension: "jpg",
        matches(buffer) {
            return buffer.length >= 3 &&
                buffer[0] === 0xff &&
                buffer[1] === 0xd8 &&
                buffer[2] === 0xff;
        }
    },
    "image/png": {
        extension: "png",
        matches(buffer) {
            const signature = "89504e470d0a1a0a";
            return buffer.length >= 8 && buffer.subarray(0, 8).toString("hex") === signature;
        }
    },
    "image/webp": {
        extension: "webp",
        matches(buffer) {
            return buffer.length >= 12 &&
                buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
                buffer.subarray(8, 12).toString("ascii") === "WEBP";
        }
    }
};

function sanitizeBaseName(originalName) {
    const withoutExtension = String(originalName || "")
        .replace(/\.[^.]+$/, "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 50);

    return withoutExtension || "producto";
}

function decodeBase64(value) {
    if (typeof value !== "string" || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
        return null;
    }

    const buffer = Buffer.from(value, "base64");
    if (buffer.length === 0 || buffer.toString("base64").replace(/=+$/, "") !== value.replace(/=+$/, "")) {
        return null;
    }

    return buffer;
}

exports.handler = async event => {
    if (event.httpMethod !== "POST") return methodNotAllowed(["POST"]);

    const originError = requireSameOrigin(event);
    if (originError) return originError;

    try {
        if (!hasValidSession(event)) {
            return jsonResponse(401, { error: "La sesión expiró. Vuelve a ingresar." });
        }

        const body = parseJsonBody(event, 4_500_000);
        const imageType = ALLOWED_IMAGES[body.type];
        const image = decodeBase64(body.data);

        if (!imageType || !image || !imageType.matches(image)) {
            return jsonResponse(400, {
                error: "Selecciona una imagen JPG, PNG o WEBP válida."
            });
        }

        if (image.length > MAX_IMAGE_SIZE) {
            return jsonResponse(413, {
                error: "La imagen supera el límite de 3 MB."
            });
        }

        const safeName = sanitizeBaseName(body.name);
        const uniquePart = `${Date.now()}-${randomBytes(4).toString("hex")}`;
        const fileName = `${safeName}-${uniquePart}.${imageType.extension}`;
        const filePath = `${UPLOAD_DIRECTORY}/${fileName}`;

        const result = await putRepositoryFile(
            filePath,
            image,
            `admin: subir imagen ${fileName}`
        );

        return jsonResponse(201, {
            message: "Imagen subida correctamente.",
            path: filePath,
            commitSha: result.commit && result.commit.sha
        });
    } catch (error) {
        console.error("Error al subir imagen a GitHub.", error);

        if (error.statusCode === 400 || error.statusCode === 413) {
            return jsonResponse(error.statusCode, { error: error.message });
        }

        if (error instanceof GitHubError && error.statusCode === 422) {
            return jsonResponse(409, {
                error: "Ya existe una imagen con ese nombre. Intenta nuevamente."
            });
        }

        return jsonResponse(500, {
            error: "No fue posible subir la imagen a GitHub."
        });
    }
};
