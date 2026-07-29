"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Core = require("../admin/admin-core");

const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

function imagen(overrides = {}) {
    return {
        name: "robot.jpeg",
        type: "image/jpeg",
        size: 1024,
        ...overrides
    };
}

function crearControlador(overrides = {}) {
    return Core.crearControladorSubidaImagen({
        tiposPermitidos: ALLOWED_IMAGE_TYPES,
        tamanoMaximo: MAX_IMAGE_SIZE,
        convertirBase64: async () => "base64-prueba",
        enviar: async () => ({
            message: "Imagen subida correctamente.",
            path: "imagenes/uploads/robot-prueba.jpg"
        }),
        ...overrides
    });
}

test("el botón de subida está asociado y no envía el formulario", () => {
    const raiz = path.resolve(__dirname, "..");
    const html = fs.readFileSync(path.join(raiz, "admin", "index.html"), "utf8");
    const javascript = fs.readFileSync(path.join(raiz, "admin", "admin.js"), "utf8");

    assert.match(
        html,
        /id="subir-imagen"[^>]*type="button"|type="button"[^>]*id="subir-imagen"/
    );
    assert.match(
        javascript,
        /elementos\.subirImagen\.addEventListener\("click", subirImagen\)/
    );
    assert.match(javascript, /credentials:\s*"same-origin"/);
});

test("selecciona JPG, JPEG, PNG y WEBP y conserva el archivo en memoria", () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
        const controlador = crearControlador();
        const archivo = imagen({ type });
        assert.deepEqual(controlador.seleccionar(archivo), {
            aceptada: true,
            error: ""
        });
        assert.equal(controlador.obtenerArchivo(), archivo);
    }
});

test("rechaza tipos no permitidos y archivos sobre 3 MB", () => {
    const controlador = crearControlador();
    assert.match(
        controlador.seleccionar(imagen({ type: "image/svg+xml" })).error,
        /JPG, PNG o WEBP/
    );
    assert.match(
        controlador.seleccionar(imagen({ size: MAX_IMAGE_SIZE + 1 })).error,
        /3 MB/
    );
    assert.equal(controlador.tieneArchivo(), false);
});

test("envía exactamente name, type y data y procesa path y message", async () => {
    let payload;
    const controlador = crearControlador({
        enviar: async datos => {
            payload = datos;
            return {
                message: "Imagen subida correctamente.",
                path: "imagenes/uploads/robot-prueba.jpg"
            };
        }
    });
    controlador.seleccionar(imagen());

    const resultado = await controlador.subir();
    assert.deepEqual(payload, {
        name: "robot.jpeg",
        type: "image/jpeg",
        data: "base64-prueba"
    });
    assert.equal(resultado.ruta, "imagenes/uploads/robot-prueba.jpg");
    assert.equal(resultado.mensaje, "Imagen subida correctamente.");
    assert.equal(resultado.previewUrl, "data:image/jpeg;base64,base64-prueba");
    assert.equal(controlador.tieneArchivo(), false);
});

test("rellena la ruta, limpia la validación y emite input y change", () => {
    const eventos = [];
    const input = {
        value: "",
        validationMessage: "Completa este campo.",
        setCustomValidity(mensaje) {
            this.validationMessage = mensaje;
        },
        dispatchEvent(evento) {
            eventos.push({ type: evento.type, bubbles: evento.bubbles });
        }
    };
    class EventoPrueba {
        constructor(type, options) {
            this.type = type;
            this.bubbles = options.bubbles;
        }
    }

    Core.asignarRutaImagen(
        input,
        "imagenes/uploads/robot-prueba.jpg",
        EventoPrueba
    );

    assert.equal(input.value, "imagenes/uploads/robot-prueba.jpg");
    assert.equal(input.validationMessage, "");
    assert.deepEqual(eventos, [
        { type: "input", bubbles: true },
        { type: "change", bubbles: true }
    ]);
});

test("muestra un error claro si el servidor no devuelve path y permite reintentar", async () => {
    const controlador = crearControlador({
        enviar: async () => ({ message: "Respuesta incompleta" })
    });
    controlador.seleccionar(imagen());

    await assert.rejects(
        controlador.subir(),
        /no devolvió la ruta/
    );
    assert.equal(controlador.estaProcesando(), false);
    assert.equal(controlador.tieneArchivo(), true);
});

test("propaga errores HTTP y conserva la imagen para reintentar", async () => {
    const controlador = crearControlador({
        enviar: async () => {
            throw new Error("No fue posible subir la imagen a GitHub.");
        }
    });
    controlador.seleccionar(imagen());

    await assert.rejects(
        controlador.subir(),
        /No fue posible subir/
    );
    assert.equal(controlador.tieneArchivo(), true);
    assert.equal(controlador.estaProcesando(), false);
});

test("impide dos subidas simultáneas y no duplica la solicitud", async () => {
    let resolver;
    let solicitudes = 0;
    const respuestaPendiente = new Promise(resolve => {
        resolver = resolve;
    });
    const controlador = crearControlador({
        enviar: async () => {
            solicitudes++;
            return respuestaPendiente;
        }
    });
    controlador.seleccionar(imagen());

    const primera = controlador.subir();
    const segunda = await controlador.subir();
    assert.deepEqual(segunda, { iniciada: false });
    assert.equal(solicitudes, 1);
    resolver({
        message: "Imagen subida correctamente.",
        path: "imagenes/uploads/robot-prueba.jpg"
    });
    await primera;
    assert.equal(solicitudes, 1);
});
