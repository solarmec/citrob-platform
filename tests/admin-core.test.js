"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Core = require("../admin/admin-core");

function productoValido(id = "producto-prueba") {
    return {
        id,
        nombre: "Producto prueba",
        categoria: "robots",
        descripcion: "Descripción breve",
        detalle: "Detalle del producto",
        especificaciones: ["Primera especificación"],
        video: "",
        precio: 1000,
        stock: true,
        destacado: false,
        activo: true,
        imagen: "imagenes/robots/prueba.jpg"
    };
}

test("crea, edita y elimina productos localmente sin mutar el arreglo original", () => {
    const originales = [productoValido("original")];
    const creado = productoValido("nuevo");
    const conNuevo = Core.guardarLocal(originales, creado, null);
    assert.equal(conNuevo.length, 2);
    assert.equal(originales.length, 1);

    const editado = { ...creado, nombre: "Nuevo editado" };
    const conEdicion = Core.guardarLocal(conNuevo, editado, "nuevo");
    assert.equal(conEdicion.find(item => item.id === "nuevo").nombre, "Nuevo editado");

    const eliminado = Core.eliminarLocal(conEdicion, "nuevo");
    assert.deepEqual(eliminado.map(item => item.id), ["original"]);
});

test("detecta ID duplicado", () => {
    const producto = productoValido("repetido");
    const errores = Core.validarProducto(producto, [productoValido("repetido")], null);
    assert.ok(errores.some(error => error.includes("Ya existe")));
});

test("detecta nombre duplicado aunque cambien mayúsculas o espacios", () => {
    const producto = productoValido("segundo");
    producto.nombre = "  PRODUCTO PRUEBA ";
    const errores = Core.validarProducto(producto, [productoValido("primero")], null);
    assert.ok(errores.some(error => error.includes("nombre")));
});

test("detecta precio y disponibilidad inválidos", () => {
    const producto = productoValido();
    producto.precio = -1;
    producto.stock = 3;
    const errores = Core.validarProducto(producto, [], null);
    assert.ok(errores.some(error => error.includes("precio")));
    assert.ok(errores.some(error => error.includes("disponibilidad")));
});

test("acepta productos antiguos sin el campo activo", () => {
    const producto = productoValido();
    delete producto.activo;
    assert.deepEqual(Core.validarProducto(producto, [], producto.id), []);
});

test("filtra por texto y categoría", () => {
    const productos = [
        productoValido("robot-uno"),
        { ...productoValido("motor-uno"), nombre: "Motor DC", categoria: "motores" }
    ];
    assert.deepEqual(Core.filtrarProductos(productos, "motor", "motores").map(item => item.id), ["motor-uno"]);
});
