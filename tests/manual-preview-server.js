"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const { createPasswordHash } = require("../netlify/functions/_lib/auth");

const root = path.resolve(__dirname, "..");
const productsPath = path.join(root, "data", "productos.json");
const port = Number(process.env.CITROB_PREVIEW_PORT || 4173);
let mockProducts = fs.readFileSync(productsPath, "utf8");
let mockSha = "preview-sha-1";

const functions = {
    "admin-login": require("../netlify/functions/admin-login").handler,
    "admin-logout": require("../netlify/functions/admin-logout").handler,
    "admin-session": require("../netlify/functions/admin-session").handler,
    "products-get": require("../netlify/functions/products-get").handler,
    "products-save": require("../netlify/functions/products-save").handler,
    "image-upload": require("../netlify/functions/image-upload").handler
};

const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".webp": "image/webp"
};

async function configure() {
    const previewPassword = process.env.CITROB_PREVIEW_PASSWORD;
    if (!previewPassword || previewPassword.length < 12) {
        throw new Error("Define CITROB_PREVIEW_PASSWORD con al menos 12 caracteres.");
    }
    process.env.SESSION_SECRET = randomBytes(48).toString("base64url");
    process.env.ADMIN_PASSWORD_HASH = await createPasswordHash(previewPassword);
    process.env.GITHUB_TOKEN = `preview-${randomBytes(16).toString("hex")}`;
    process.env.GITHUB_OWNER = "solarmec";
    process.env.GITHUB_REPO = "citrob-platform";
    process.env.GITHUB_BRANCH = "panel-admin";

    global.fetch = async (url, options = {}) => {
        const method = options.method || "GET";
        if (method === "GET") {
            return new Response(JSON.stringify({
                type: "file",
                path: "data/productos.json",
                sha: mockSha,
                encoding: "base64",
                content: Buffer.from(mockProducts).toString("base64")
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        }

        const body = JSON.parse(options.body || "{}");
        if (String(url).includes("/data/productos.json")) {
            mockProducts = Buffer.from(body.content, "base64").toString("utf8");
        }
        mockSha = `preview-sha-${Date.now()}`;
        return new Response(JSON.stringify({
            content: { sha: mockSha },
            commit: { sha: "preview-commit" }
        }), { status: 200, headers: { "Content-Type": "application/json" } });
    };
}

function bodyFromRequest(request) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        request.on("data", chunk => chunks.push(chunk));
        request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        request.on("error", reject);
    });
}

async function serveFunction(request, response, name) {
    const body = await bodyFromRequest(request);
    const result = await functions[name]({
        httpMethod: request.method,
        headers: {
            ...request.headers,
            host: request.headers.host,
            origin: request.headers.origin || `http://${request.headers.host}`,
            "x-forwarded-proto": "http"
        },
        body
    });
    response.writeHead(result.statusCode, result.headers);
    response.end(result.body);
}

function serveStatic(request, response) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/__mobile-admin") {
        response.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store"
        });
        response.end(`<!doctype html>
<html><head><meta charset="utf-8"><title>Mobile preview</title>
<style>html,body{margin:0;background:#333}iframe{display:block;width:390px;height:844px;border:0;margin:auto;background:white}</style>
</head><body><iframe src="/admin/" title="Panel móvil"></iframe></body></html>`);
        return;
    }
    if (pathname === "/data/productos.json") {
        response.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store"
        });
        response.end(mockProducts);
        return;
    }
    if (pathname === "/") pathname = "/index.html";
    if (pathname === "/admin" || pathname === "/admin/") pathname = "/admin/index.html";

    const resolved = path.resolve(root, `.${pathname}`);
    if (!resolved.startsWith(root + path.sep)) {
        response.writeHead(403);
        response.end("Forbidden");
        return;
    }

    fs.stat(resolved, (error, stat) => {
        if (error || !stat.isFile()) {
            response.writeHead(404);
            response.end("Not found");
            return;
        }
        response.writeHead(200, {
            "Content-Type": mimeTypes[path.extname(resolved).toLowerCase()] || "application/octet-stream",
            "Cache-Control": "no-store"
        });
        fs.createReadStream(resolved).pipe(response);
    });
}

configure().then(() => {
    http.createServer(async (request, response) => {
        try {
            const match = request.url.match(/^\/\.netlify\/functions\/([a-z-]+)/);
            if (match && functions[match[1]]) {
                await serveFunction(request, response, match[1]);
                return;
            }
            serveStatic(request, response);
        } catch (error) {
            console.error(error);
            response.writeHead(500, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ error: "Preview error" }));
        }
    }).listen(port, "127.0.0.1", () => {
        console.log(`Preview CITROB: http://127.0.0.1:${port}/admin/`);
        console.log("Usa el valor temporal de CITROB_PREVIEW_PASSWORD.");
    });
});
