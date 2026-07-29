"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { randomBytes } = require("node:crypto");
const {
    SESSION_COOKIE,
    createPasswordHash,
    createSessionToken
} = require("../netlify/functions/_lib/auth");

const login = require("../netlify/functions/admin-login").handler;
const logout = require("../netlify/functions/admin-logout").handler;
const session = require("../netlify/functions/admin-session").handler;
const productsGet = require("../netlify/functions/products-get").handler;
const productsSave = require("../netlify/functions/products-save").handler;
const imageUpload = require("../netlify/functions/image-upload").handler;

const password = "clave-prueba-segura";
let cookie;
let originalFetch;

function evento(method, body, headers = {}) {
    return {
        httpMethod: method,
        body: body === undefined ? null : JSON.stringify(body),
        headers: {
            host: "localhost:8888",
            origin: "http://localhost:8888",
            ...headers
        }
    };
}

test("las operaciones POST rechazan orígenes externos o protocolos distintos", async () => {
    const origenExterno = await login(evento("POST", { password }, {
        origin: "https://sitio-malicioso.example"
    }));
    assert.equal(origenExterno.statusCode, 403);

    const protocoloDistinto = await login(evento("POST", { password }, {
        "x-forwarded-proto": "https"
    }));
    assert.equal(protocoloDistinto.statusCode, 403);
});

test.before(async () => {
    process.env.SESSION_SECRET = randomBytes(48).toString("base64url");
    process.env.ADMIN_PASSWORD_HASH = await createPasswordHash(password);
    process.env.GITHUB_TOKEN = `test-${randomBytes(16).toString("hex")}`;
    process.env.GITHUB_OWNER = "solarmec";
    process.env.GITHUB_REPO = "citrob-platform";
    process.env.GITHUB_BRANCH = "panel-admin";
    originalFetch = global.fetch;

    const respuesta = await login(evento("POST", { password }));
    cookie = respuesta.headers["Set-Cookie"].split(";")[0];
});

test.after(() => {
    global.fetch = originalFetch;
});

test("login rechaza contraseña incorrecta y acepta la correcta", async () => {
    const incorrecta = await login(evento("POST", { password: "incorrecta" }));
    assert.equal(incorrecta.statusCode, 401);

    const correcta = await login(evento("POST", { password }));
    assert.equal(correcta.statusCode, 200);
    assert.match(correcta.headers["Set-Cookie"], /HttpOnly/);
    assert.match(correcta.headers["Set-Cookie"], /SameSite=Strict/);
});

test("sesión válida, logout y sesión vencida", async () => {
    const valida = await session(evento("GET", undefined, { cookie }));
    assert.equal(valida.statusCode, 200);
    assert.equal(JSON.parse(valida.body).authenticated, true);

    const salida = await logout(evento("POST", {}, { cookie }));
    assert.equal(salida.statusCode, 200);
    assert.match(salida.headers["Set-Cookie"], /Max-Age=0/);

    const tokenVencido = createSessionToken(
        process.env.SESSION_SECRET,
        Date.now() - 9 * 60 * 60 * 1000
    );
    const vencida = await session(evento("GET", undefined, {
        cookie: `${SESSION_COOKIE}=${tokenVencido}`
    }));
    assert.equal(JSON.parse(vencida.body).authenticated, false);
});

test("products-get exige sesión y devuelve catálogo con SHA usando GitHub simulado", async () => {
    const sinSesion = await productsGet(evento("GET"));
    assert.equal(sinSesion.statusCode, 401);

    const contenido = fs.readFileSync(
        path.join(__dirname, "..", "data", "productos.json"),
        "utf8"
    );
    global.fetch = async () => new Response(JSON.stringify({
        type: "file",
        sha: "sha-prueba",
        content: Buffer.from(contenido).toString("base64"),
        encoding: "base64"
    }), { status: 200, headers: { "Content-Type": "application/json" } });

    const respuesta = await productsGet(evento("GET", undefined, { cookie }));
    const datos = JSON.parse(respuesta.body);
    assert.equal(respuesta.statusCode, 200);
    assert.equal(datos.sha, "sha-prueba");
    assert.equal(datos.productos.length, 18);
});

test("products-save detecta conflicto y simula guardado sin escribir en GitHub", async () => {
    const productos = JSON.parse(fs.readFileSync(
        path.join(__dirname, "..", "data", "productos.json"),
        "utf8"
    )).productos;

    global.fetch = async () => new Response(JSON.stringify({
        type: "file",
        sha: "sha-mas-reciente",
        content: Buffer.from(JSON.stringify({ productos })).toString("base64"),
        encoding: "base64"
    }), { status: 200, headers: { "Content-Type": "application/json" } });

    const conflicto = await productsSave(evento("POST", {
        expectedSha: "sha-antiguo",
        productos
    }, { cookie }));
    assert.equal(conflicto.statusCode, 409);

    let metodos = [];
    global.fetch = async (url, options = {}) => {
        metodos.push(options.method || "GET");
        if ((options.method || "GET") === "GET") {
            return new Response(JSON.stringify({
                type: "file",
                sha: "sha-actual",
                content: Buffer.from(JSON.stringify({ productos })).toString("base64"),
                encoding: "base64"
            }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({
            content: { sha: "sha-nuevo" },
            commit: { sha: "commit-simulado" }
        }), { status: 200, headers: { "Content-Type": "application/json" } });
    };

    const guardado = await productsSave(evento("POST", {
        expectedSha: "sha-actual",
        productos
    }, { cookie }));
    assert.equal(guardado.statusCode, 200);
    assert.deepEqual(metodos, ["GET", "PUT"]);
});

test("products-save rechaza nombres duplicados antes de contactar GitHub", async () => {
    const productos = JSON.parse(fs.readFileSync(
        path.join(__dirname, "..", "data", "productos.json"),
        "utf8"
    )).productos;
    const duplicados = productos.map(producto => ({ ...producto }));
    duplicados[1].nombre = ` ${duplicados[0].nombre.toUpperCase()} `;
    global.fetch = async () => {
        throw new Error("No debería llamar a GitHub");
    };

    const respuesta = await productsSave(evento("POST", {
        expectedSha: "sha-actual",
        productos: duplicados
    }, { cookie }));
    assert.equal(respuesta.statusCode, 400);
    assert.match(respuesta.body, /repetido/);
});

test("image-upload rechaza archivos no permitidos y exige sesión", async () => {
    const sinSesion = await imageUpload(evento("POST", {
        name: "archivo.exe",
        type: "application/octet-stream",
        data: "YWJj"
    }));
    assert.equal(sinSesion.statusCode, 401);

    const invalida = await imageUpload(evento("POST", {
        name: "archivo.exe",
        type: "application/octet-stream",
        data: "YWJj"
    }, { cookie }));
    assert.equal(invalida.statusCode, 400);

    let solicitudImagen;
    global.fetch = async (url, options = {}) => {
        solicitudImagen = { url: String(url), options };
        return new Response(JSON.stringify({
            content: { sha: "sha-imagen" },
            commit: { sha: "commit-imagen-simulado" }
        }), { status: 201, headers: { "Content-Type": "application/json" } });
    };

    const pngMinimo = Buffer.from("89504e470d0a1a0a", "hex").toString("base64");
    const valida = await imageUpload(evento("POST", {
        name: "Imagen de prueba.png",
        type: "image/png",
        data: pngMinimo
    }, { cookie }));
    assert.equal(valida.statusCode, 201);
    const respuestaImagen = JSON.parse(valida.body);
    assert.equal(respuestaImagen.message, "Imagen subida correctamente.");
    assert.match(respuestaImagen.path, /^imagenes\/uploads\/imagen-de-prueba-/);
    assert.match(
        solicitudImagen.url,
        /\/repos\/solarmec\/citrob-platform\/contents\/imagenes\/uploads\//
    );
    assert.equal(solicitudImagen.options.method, "PUT");
    const cuerpoGitHub = JSON.parse(solicitudImagen.options.body);
    assert.equal(cuerpoGitHub.branch, "panel-admin");
    assert.equal(cuerpoGitHub.content, pngMinimo);
});

test("los errores de GitHub se convierten en un mensaje seguro", async () => {
    global.fetch = async () => new Response(
        JSON.stringify({ message: "Bad credentials" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
    );
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
        const respuesta = await productsGet(evento("GET", undefined, { cookie }));
        assert.equal(respuesta.statusCode, 502);
        assert.doesNotMatch(respuesta.body, /GITHUB_TOKEN|Bearer|Bad credentials/);
    } finally {
        console.error = originalConsoleError;
    }
});
