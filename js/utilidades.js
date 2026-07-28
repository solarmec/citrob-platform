(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.CitrobUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const ENTIDADES_HTML = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    };

    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => ENTIDADES_HTML[caracter]);
    }

    function construirUrlWhatsapp(telefono, mensaje) {
        const numero = String(telefono || "").replace(/\D/g, "");
        return `https://wa.me/${numero}?text=${encodeURIComponent(String(mensaje || ""))}`;
    }

    return {
        construirUrlWhatsapp,
        escaparHTML
    };
});

const { construirUrlWhatsapp, escaparHTML } = CitrobUtils;
