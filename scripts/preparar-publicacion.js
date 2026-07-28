"use strict";

const fs = require("node:fs");
const path = require("node:path");

const raiz = path.resolve(__dirname, "..");
const salida = path.join(raiz, "dist");

if (path.dirname(salida) !== raiz || path.basename(salida) !== "dist") {
    throw new Error("La carpeta de salida no es segura.");
}

fs.rmSync(salida, { recursive: true, force: true });
fs.mkdirSync(salida, { recursive: true });

function copiarArchivo(rutaRelativa) {
    const origen = path.join(raiz, rutaRelativa);
    const destino = path.join(salida, rutaRelativa);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.copyFileSync(origen, destino);
}

function copiarDirectorio(rutaRelativa) {
    fs.cpSync(
        path.join(raiz, rutaRelativa),
        path.join(salida, rutaRelativa),
        { recursive: true }
    );
}

["index.html", "style.css"].forEach(copiarArchivo);
["js", "data", "imagenes"].forEach(copiarDirectorio);
[
    "admin/index.html",
    "admin/admin.css",
    "admin/admin-core.js",
    "admin/admin.js"
].forEach(copiarArchivo);

const requeridos = [
    "index.html",
    "style.css",
    "data/productos.json",
    "js/main.js",
    "admin/index.html",
    "admin/admin.js"
];

for (const rutaRelativa of requeridos) {
    if (!fs.existsSync(path.join(salida, rutaRelativa))) {
        throw new Error(`Falta un archivo público requerido: ${rutaRelativa}`);
    }
}

const internos = [
    "package.json",
    "netlify.toml",
    "PANEL_ADMIN_SETUP.md",
    "admin/config.yml",
    "netlify/functions",
    "scripts",
    "tests"
];

for (const rutaRelativa of internos) {
    if (fs.existsSync(path.join(salida, rutaRelativa))) {
        throw new Error(`Se intentó publicar un archivo interno: ${rutaRelativa}`);
    }
}

console.log("Publicación preparada en dist/ con únicamente archivos públicos.");
