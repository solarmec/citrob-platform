(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.CitrobAdminCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const CATEGORIAS = ["robots", "makex", "arenas", "motores", "componentes"];
    const MAX_PRICE = 999999999;

    function copiar(valor) {
        return JSON.parse(JSON.stringify(valor));
    }

    function idDesdeNombre(nombre) {
        return String(nombre || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80);
    }

    function productoNuevo() {
        return {
            id: "",
            nombre: "",
            categoria: "robots",
            descripcion: "",
            detalle: "",
            especificaciones: [],
            video: "",
            precio: 0,
            stock: true,
            destacado: false,
            activo: true,
            imagen: ""
        };
    }

    function validarProducto(producto, productos, idOriginal) {
        const errores = [];
        const textoSeguro = (valor, maximo, obligatorio = true) =>
            typeof valor === "string" &&
            valor.length <= maximo &&
            (!obligatorio || valor.trim().length > 0) &&
            !/[<>]/.test(valor);

        if (
            typeof producto.id !== "string" ||
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(producto.id) ||
            producto.id.length > 80
        ) {
            errores.push("El ID solo puede contener minúsculas, números y guiones.");
        }

        const repetido = productos.some(item =>
            item.id === producto.id && item.id !== idOriginal
        );
        if (repetido) errores.push("Ya existe un producto con ese ID.");

        if (!textoSeguro(producto.nombre, 160)) {
            errores.push("El nombre es obligatorio y no puede contener HTML.");
        } else {
            const nombreNormalizado = producto.nombre.trim().toLocaleLowerCase("es");
            const nombreRepetido = productos.some(item =>
                item.id !== idOriginal &&
                String(item.nombre || "").trim().toLocaleLowerCase("es") === nombreNormalizado
            );
            if (nombreRepetido) errores.push("Ya existe un producto con ese nombre.");
        }
        if (!CATEGORIAS.includes(producto.categoria)) {
            errores.push("Selecciona una categoría válida.");
        }
        if (!textoSeguro(producto.descripcion, 500)) {
            errores.push("La descripción es obligatoria y no puede contener HTML.");
        }
        if (!textoSeguro(producto.detalle, 5000)) {
            errores.push("El detalle es obligatorio y no puede contener HTML.");
        }
        if (
            !Array.isArray(producto.especificaciones) ||
            producto.especificaciones.length === 0 ||
            producto.especificaciones.some(item => !textoSeguro(item, 500))
        ) {
            errores.push("Agrega al menos una especificación válida, una por línea.");
        }
        if (!Number.isInteger(producto.precio) || producto.precio < 0 || producto.precio > MAX_PRICE) {
            errores.push("El precio debe ser un número entero no negativo.");
        }
        if (
            producto.precioAnterior !== undefined &&
            (
                !Number.isInteger(producto.precioAnterior) ||
                producto.precioAnterior <= producto.precio ||
                producto.precioAnterior > MAX_PRICE
            )
        ) {
            errores.push("El precio anterior debe ser un entero mayor que el precio actual.");
        }
        if (typeof producto.stock !== "boolean") errores.push("El estado de disponibilidad no es válido.");
        if (typeof producto.destacado !== "boolean") errores.push("El estado destacado no es válido.");
        if (producto.activo !== undefined && typeof producto.activo !== "boolean") {
            errores.push("El estado visible no es válido.");
        }

        const imagen = typeof producto.imagen === "string" ? producto.imagen : "";
        const rutaLocal = /^\/?imagenes\/[a-zA-Z0-9_./-]+\.(?:jpe?g|png|webp)$/i.test(imagen) &&
            !imagen.includes("..");
        let urlHttps = false;
        try {
            urlHttps = new URL(imagen).protocol === "https:";
        } catch {
            urlHttps = false;
        }
        if (!rutaLocal && !urlHttps) errores.push("La imagen debe ser una ruta de imagen local o una URL HTTPS.");

        if (producto.video) {
            try {
                if (new URL(producto.video).protocol !== "https:") throw new Error();
            } catch {
                errores.push("El video debe ser una URL HTTPS válida.");
            }
        }

        return errores;
    }

    function guardarLocal(productos, producto, idOriginal) {
        const copiaProductos = copiar(productos);
        const copiaProducto = copiar(producto);
        const indice = copiaProductos.findIndex(item => item.id === idOriginal);
        if (indice === -1) copiaProductos.push(copiaProducto);
        else copiaProductos[indice] = copiaProducto;
        return copiaProductos;
    }

    function eliminarLocal(productos, id) {
        return copiar(productos).filter(producto => producto.id !== id);
    }

    function filtrarProductos(productos, busqueda, categoria) {
        const texto = String(busqueda || "").trim().toLowerCase();
        return productos.filter(producto => {
            const coincideCategoria = !categoria || producto.categoria === categoria;
            const contenido = `${producto.nombre || ""} ${producto.id || ""} ${producto.descripcion || ""}`.toLowerCase();
            return coincideCategoria && (!texto || contenido.includes(texto));
        });
    }

    function formatearPrecio(precio) {
        return precio === 0 ? "Consultar" : `$${Number(precio).toLocaleString("es-CL")}`;
    }

    function crearControladorSubidaImagen({
        tiposPermitidos,
        tamanoMaximo,
        convertirBase64,
        enviar
    }) {
        let archivo = null;
        let procesando = false;

        function seleccionar(candidato) {
            if (procesando) {
                return {
                    aceptada: false,
                    error: "Espera a que termine la subida actual."
                };
            }

            archivo = null;
            if (!candidato) return { aceptada: false, error: "" };

            if (!tiposPermitidos.includes(candidato.type)) {
                return {
                    aceptada: false,
                    error: "Selecciona una imagen JPG, PNG o WEBP."
                };
            }

            if (!Number.isFinite(candidato.size) || candidato.size > tamanoMaximo) {
                return {
                    aceptada: false,
                    error: "La imagen supera el límite de 3 MB."
                };
            }

            archivo = candidato;
            return { aceptada: true, error: "" };
        }

        async function subir() {
            if (!archivo || procesando) return { iniciada: false };

            const archivoActual = archivo;
            procesando = true;

            try {
                const data = await convertirBase64(archivoActual);
                const respuesta = await enviar({
                    name: archivoActual.name,
                    type: archivoActual.type,
                    data
                });
                const ruta = respuesta && typeof respuesta.path === "string"
                    ? respuesta.path.trim()
                    : "";

                if (!ruta) {
                    throw new Error("El servidor no devolvió la ruta de la imagen subida.");
                }

                archivo = null;
                return {
                    iniciada: true,
                    ruta,
                    mensaje: respuesta.message || "Imagen subida correctamente.",
                    previewUrl: `data:${archivoActual.type};base64,${data}`
                };
            } finally {
                procesando = false;
            }
        }

        function limpiar() {
            if (!procesando) archivo = null;
        }

        return {
            estaProcesando: () => procesando,
            limpiar,
            obtenerArchivo: () => archivo,
            seleccionar,
            subir,
            tieneArchivo: () => Boolean(archivo)
        };
    }

    function asignarRutaImagen(input, ruta, ConstructorEvento) {
        const rutaNormalizada = typeof ruta === "string" ? ruta.trim() : "";
        if (!input || !rutaNormalizada) {
            throw new Error("No fue posible aplicar la ruta de la imagen al formulario.");
        }

        input.value = rutaNormalizada;
        if (typeof input.setCustomValidity === "function") {
            input.setCustomValidity("");
        }

        const Evento = ConstructorEvento ||
            (typeof Event === "function" ? Event : null);
        if (Evento && typeof input.dispatchEvent === "function") {
            input.dispatchEvent(new Evento("input", { bubbles: true }));
            input.dispatchEvent(new Evento("change", { bubbles: true }));
        }

        return rutaNormalizada;
    }

    return {
        CATEGORIAS,
        asignarRutaImagen,
        copiar,
        crearControladorSubidaImagen,
        eliminarLocal,
        filtrarProductos,
        formatearPrecio,
        guardarLocal,
        idDesdeNombre,
        productoNuevo,
        validarProducto
    };
});
