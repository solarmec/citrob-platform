"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { validateProducts } = require("../netlify/functions/_lib/products");

const raiz = path.resolve(__dirname, "..");
const archivosJavaScript = [];

function recorrer(directorio) {
    for (const entrada of fs.readdirSync(directorio, { withFileTypes: true })) {
        if ([".git", ".netlify", "dist", "node_modules"].includes(entrada.name)) continue;
        const ruta = path.join(directorio, entrada.name);
        if (entrada.isDirectory()) recorrer(ruta);
        else if (entrada.name.endsWith(".js")) archivosJavaScript.push(ruta);
    }
}

recorrer(raiz);
for (const archivo of archivosJavaScript) {
    execFileSync(process.execPath, ["--check", archivo], { stdio: "pipe" });
}

const catalogo = JSON.parse(fs.readFileSync(path.join(raiz, "data", "productos.json"), "utf8"));
if (!Array.isArray(catalogo.productos)) {
    throw new Error("data/productos.json no contiene el arreglo productos.");
}

const ids = new Set(catalogo.productos.map(producto => producto.id));
if (ids.size !== catalogo.productos.length) {
    throw new Error("Hay IDs repetidos en data/productos.json.");
}

const validacion = validateProducts(catalogo.productos);
if (!validacion.valid) {
    throw new Error(`Catálogo inválido:\n- ${validacion.errors.join("\n- ")}`);
}

function comprobarRutaConMayusculasExactas(rutaRelativa) {
    const segmentos = rutaRelativa.replace(/^\/+/, "").split("/");
    let actual = raiz;

    for (const segmento of segmentos) {
        const nombres = fs.readdirSync(actual);
        if (!nombres.includes(segmento)) {
            throw new Error(`No existe la ruta con mayúsculas exactas: ${rutaRelativa}`);
        }
        actual = path.join(actual, segmento);
    }
}

for (const producto of catalogo.productos) {
    if (/^\/?imagenes\//.test(producto.imagen)) {
        comprobarRutaConMayusculasExactas(producto.imagen);
    }
}

const indexHtml = fs.readFileSync(path.join(raiz, "index.html"), "utf8");
if (!/<meta\s+name="viewport"/i.test(indexHtml)) {
    throw new Error("index.html no declara viewport para dispositivos móviles.");
}
if (!indexHtml.includes('<script src="js/utilidades.js"></script>')) {
    throw new Error("index.html no carga las utilidades de seguridad de la tienda.");
}

const archivosTexto = [];
function reunirTexto(directorio) {
    for (const entrada of fs.readdirSync(directorio, { withFileTypes: true })) {
        if ([".git", ".netlify", "dist", "node_modules", "imagenes"].includes(entrada.name)) continue;
        const ruta = path.join(directorio, entrada.name);
        if (entrada.isDirectory()) reunirTexto(ruta);
        else if (/\.(?:js|json|html|css|md|toml|ya?ml|example)$/i.test(entrada.name)) {
            archivosTexto.push(ruta);
        }
    }
}
reunirTexto(raiz);
for (const archivo of archivosTexto) {
    const contenido = fs.readFileSync(archivo, "utf8");
    const nombreRepositorioAntiguo = ["citrob", "plataform"].join("-");
    if (contenido.includes(nombreRepositorioAntiguo)) {
        throw new Error(`Referencia antigua al repositorio en ${path.relative(raiz, archivo)}.`);
    }
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(contenido)) {
        throw new Error(`Posible clave privada en ${path.relative(raiz, archivo)}.`);
    }
}

console.log(`JavaScript válido: ${archivosJavaScript.length} archivos.`);
console.log(`JSON válido: ${catalogo.productos.length} productos con IDs y nombres únicos.`);
console.log("Imágenes locales válidas y con mayúsculas exactas.");
console.log("Sin referencias antiguas al repositorio ni claves privadas detectadas.");
