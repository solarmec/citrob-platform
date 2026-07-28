"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    construirUrlWhatsapp,
    escaparHTML
} = require("../js/utilidades");

test("escaparHTML neutraliza texto y atributos controlados por el catálogo", () => {
    assert.equal(
        escaparHTML('<img src=x onerror="alert(1)"> & texto'),
        "&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; texto"
    );
});

test("construirUrlWhatsapp codifica saltos de línea y caracteres especiales", () => {
    const url = construirUrlWhatsapp("+56 9 8153 3101", "Producto A&B\nTotal: $1.000");
    const parsed = new URL(url);

    assert.equal(parsed.hostname, "wa.me");
    assert.equal(parsed.pathname, "/56981533101");
    assert.equal(parsed.searchParams.get("text"), "Producto A&B\nTotal: $1.000");
});
