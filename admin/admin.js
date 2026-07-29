(function () {
    "use strict";

    const Core = window.CitrobAdminCore;
    const API_BASE = "/.netlify/functions";
    const MAX_IMAGE_SIZE = 3 * 1024 * 1024;
    const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

    const state = {
        productos: [],
        sha: "",
        cambiosPendientes: false,
        operacionActiva: false,
        idEditado: null,
        productoBase: null,
        formularioInicial: "",
        idAutomatico: false
    };

    const $ = id => document.getElementById(id);
    const elementos = {
        carga: $("cargando-inicial"),
        loginVista: $("login-vista"),
        loginForm: $("login-form"),
        loginPassword: $("login-password"),
        loginError: $("login-error"),
        loginBoton: $("login-boton"),
        panelVista: $("panel-vista"),
        cerrarSesion: $("cerrar-sesion"),
        nuevoProducto: $("nuevo-producto"),
        recargar: $("recargar-productos"),
        guardar: $("guardar-productos"),
        buscar: $("buscar-producto"),
        categoria: $("filtrar-categoria"),
        contador: $("contador-productos"),
        lista: $("lista-productos"),
        sinResultados: $("sin-resultados"),
        estadoCambios: $("estado-cambios"),
        mensajePanel: $("mensaje-panel"),
        modalProducto: $("modal-producto"),
        formularioTitulo: $("formulario-titulo"),
        productoForm: $("producto-form"),
        cerrarFormulario: $("cerrar-formulario"),
        cancelarFormulario: $("cancelar-formulario"),
        erroresProducto: $("errores-producto"),
        archivoImagen: $("archivo-imagen"),
        archivoNombre: $("archivo-nombre"),
        subirImagen: $("subir-imagen"),
        imagenPreview: $("imagen-preview"),
        modalConfirmacion: $("modal-confirmacion"),
        confirmacionTitulo: $("confirmacion-titulo"),
        confirmacionTexto: $("confirmacion-texto"),
        confirmacionAceptar: $("confirmacion-aceptar"),
        confirmacionCancelar: $("confirmacion-cancelar"),
        toast: $("toast-contenedor")
    };

    async function api(ruta, opciones = {}) {
        let respuesta;
        try {
            respuesta = await fetch(`${API_BASE}/${ruta}`, {
                ...opciones,
                headers: opciones.body
                    ? { "Content-Type": "application/json", ...(opciones.headers || {}) }
                    : opciones.headers,
                credentials: "same-origin"
            });
        } catch {
            throw new Error("No fue posible conectar con el servidor. Revisa tu conexión.");
        }

        const tipo = respuesta.headers.get("content-type") || "";
        let datos = {};
        if (tipo.includes("application/json")) {
            try {
                datos = await respuesta.json();
            } catch {
                throw new Error("El servidor devolvió una respuesta JSON inválida.");
            }
        }

        if (respuesta.status === 401 && ruta !== "admin-login") {
            mostrarLogin("La sesión expiró. Vuelve a ingresar.");
        }

        if (!respuesta.ok) {
            const error = new Error(datos.error || "Ocurrió un error inesperado.");
            error.status = respuesta.status;
            error.details = datos.details;
            throw error;
        }
        return datos;
    }

    const subidaImagen = Core.crearControladorSubidaImagen({
        tiposPermitidos: ALLOWED_IMAGE_TYPES,
        tamanoMaximo: MAX_IMAGE_SIZE,
        convertirBase64: archivoABase64,
        enviar: payload => api("image-upload", {
            method: "POST",
            body: JSON.stringify(payload)
        })
    });

    function establecerOperacion(activa) {
        state.operacionActiva = activa;
        elementos.loginBoton.disabled = activa;
        elementos.cerrarSesion.disabled = activa;
        elementos.nuevoProducto.disabled = activa;
        elementos.recargar.disabled = activa;
        elementos.guardar.disabled = activa || !state.cambiosPendientes;
        elementos.archivoImagen.disabled = activa;
        elementos.subirImagen.disabled = activa || !subidaImagen.tieneArchivo();
    }

    function mostrarLogin(mensaje = "") {
        elementos.carga.hidden = true;
        elementos.panelVista.hidden = true;
        elementos.loginVista.hidden = false;
        elementos.modalProducto.hidden = true;
        elementos.modalConfirmacion.hidden = true;
        document.body.style.overflow = "";
        elementos.loginError.textContent = mensaje;
        elementos.loginError.hidden = !mensaje;
        elementos.loginPassword.value = "";
        setTimeout(() => elementos.loginPassword.focus(), 0);
    }

    function mostrarPanel() {
        elementos.carga.hidden = true;
        elementos.loginVista.hidden = true;
        elementos.panelVista.hidden = false;
    }

    function toast(mensaje, tipo = "") {
        const item = document.createElement("div");
        item.className = `toast ${tipo}`.trim();
        item.textContent = mensaje;
        elementos.toast.appendChild(item);
        setTimeout(() => item.remove(), 4800);
    }

    function aviso(mensaje, tipo = "") {
        elementos.mensajePanel.textContent = mensaje;
        elementos.mensajePanel.className = `aviso ${tipo}`.trim();
        elementos.mensajePanel.hidden = false;
    }

    function ocultarAviso() {
        elementos.mensajePanel.hidden = true;
    }

    function marcarCambios(pendientes = true) {
        state.cambiosPendientes = pendientes;
        elementos.estadoCambios.textContent = pendientes
            ? "Hay cambios pendientes de guardar"
            : "Sin cambios pendientes";
        elementos.estadoCambios.classList.toggle("guardado", !pendientes);
        elementos.guardar.disabled = state.operacionActiva || !pendientes;
    }

    function rutaImagenParaPanel(ruta) {
        if (!ruta) return "";
        if (/^https:\/\//i.test(ruta) || ruta.startsWith("/")) return ruta;
        return `../${ruta}`;
    }

    function etiqueta(texto, clase = "") {
        const item = document.createElement("span");
        item.className = `etiqueta ${clase}`.trim();
        item.textContent = texto;
        return item;
    }

    function crearTarjeta(producto) {
        const tarjeta = document.createElement("article");
        const activo = producto.activo !== false;
        tarjeta.className = `producto-tarjeta${activo ? "" : " inactivo"}`;

        const imagen = document.createElement("img");
        imagen.className = "producto-imagen";
        imagen.src = rutaImagenParaPanel(producto.imagen);
        imagen.alt = producto.nombre;
        imagen.loading = "lazy";
        imagen.addEventListener("error", () => {
            imagen.removeAttribute("src");
            imagen.alt = "Imagen no disponible";
        }, { once: true });

        const cuerpo = document.createElement("div");
        cuerpo.className = "producto-cuerpo";
        const nombre = document.createElement("h3");
        nombre.textContent = producto.nombre;
        const id = document.createElement("p");
        id.className = "producto-id";
        id.textContent = `ID: ${producto.id}`;
        const precio = document.createElement("p");
        precio.className = "producto-precio";
        precio.textContent = Core.formatearPrecio(producto.precio);

        const meta = document.createElement("div");
        meta.className = "producto-meta";
        meta.append(
            etiqueta(producto.categoria),
            etiqueta(producto.stock ? "Disponible" : "Agotado", producto.stock ? "stock" : "agotado"),
            etiqueta(activo ? "Activo" : "Inactivo", activo ? "" : "inactivo")
        );

        const acciones = document.createElement("div");
        acciones.className = "producto-acciones";
        const editar = document.createElement("button");
        editar.type = "button";
        editar.className = "boton secundario";
        editar.textContent = "Editar";
        editar.addEventListener("click", () => abrirFormulario(producto));

        const alternar = document.createElement("button");
        alternar.type = "button";
        alternar.className = "boton secundario";
        alternar.textContent = activo ? "Desactivar" : "Activar";
        alternar.addEventListener("click", () => alternarActivo(producto.id));

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "boton secundario eliminar";
        eliminar.textContent = "Eliminar";
        eliminar.addEventListener("click", () => solicitarEliminar(producto));

        acciones.append(editar, alternar, eliminar);
        cuerpo.append(nombre, id, precio, meta, acciones);
        tarjeta.append(imagen, cuerpo);
        return tarjeta;
    }

    function renderizar() {
        const filtrados = Core.filtrarProductos(
            state.productos,
            elementos.buscar.value,
            elementos.categoria.value
        );
        elementos.lista.replaceChildren(...filtrados.map(crearTarjeta));
        elementos.contador.textContent = `${filtrados.length} de ${state.productos.length} productos`;
        elementos.sinResultados.hidden = filtrados.length !== 0;
    }

    async function cargarProductos() {
        establecerOperacion(true);
        ocultarAviso();
        aviso("Cargando el catálogo desde GitHub…");
        try {
            const datos = await api("products-get");
            state.productos = Core.copiar(datos.productos);
            state.sha = datos.sha;
            marcarCambios(false);
            renderizar();
            ocultarAviso();
            mostrarPanel();
        } catch (error) {
            if (error.status !== 401) {
                mostrarPanel();
                aviso(error.message, "error");
            }
        } finally {
            establecerOperacion(false);
        }
    }

    async function iniciar() {
        try {
            const sesion = await api("admin-session");
            if (sesion.authenticated) {
                await cargarProductos();
            } else {
                mostrarLogin();
            }
        } catch {
            mostrarLogin("No fue posible comprobar la sesión. Intenta nuevamente.");
        }
    }

    async function ingresar(evento) {
        evento.preventDefault();
        elementos.loginError.hidden = true;
        establecerOperacion(true);
        elementos.loginBoton.textContent = "Ingresando…";
        try {
            await api("admin-login", {
                method: "POST",
                body: JSON.stringify({ password: elementos.loginPassword.value })
            });
            if (state.cambiosPendientes && state.productos.length > 0) {
                mostrarPanel();
                renderizar();
                toast("Sesión renovada. Tus cambios locales siguen pendientes.", "success");
            } else {
                await cargarProductos();
            }
        } catch (error) {
            mostrarLogin(error.message);
        } finally {
            elementos.loginBoton.textContent = "Ingresar";
            establecerOperacion(false);
        }
    }

    async function cerrarSesion() {
        if (state.cambiosPendientes) {
            const continuar = await confirmar(
                "Cerrar sesión",
                "Hay cambios sin guardar. Si cierras la sesión se perderán.",
                "Cerrar de todos modos"
            );
            if (!continuar) return;
        }
        establecerOperacion(true);
        try {
            await api("admin-logout", { method: "POST", body: "{}" });
        } catch (error) {
            toast(error.message, "error");
        } finally {
            state.productos = [];
            state.sha = "";
            marcarCambios(false);
            mostrarLogin();
            establecerOperacion(false);
        }
    }

    function valoresFormulario() {
        const precioAnterior = $("producto-precio-anterior").value.trim();
        const base = state.productoBase ? Core.copiar(state.productoBase) : Core.productoNuevo();
        base.id = $("producto-id").value.trim();
        base.nombre = $("producto-nombre").value.trim();
        base.categoria = $("producto-categoria").value;
        base.descripcion = $("producto-descripcion").value.trim();
        base.detalle = $("producto-detalle").value.trim();
        base.especificaciones = $("producto-especificaciones").value
            .split(/\r?\n/)
            .map(item => item.trim())
            .filter(Boolean);
        base.video = $("producto-video").value.trim();
        base.precio = Number($("producto-precio").value);
        base.stock = $("producto-stock").checked;
        base.destacado = $("producto-destacado").checked;
        base.activo = $("producto-activo").checked;
        base.imagen = $("producto-imagen").value.trim();
        if (precioAnterior === "") delete base.precioAnterior;
        else base.precioAnterior = Number(precioAnterior);
        return base;
    }

    function serializarFormulario() {
        try {
            return JSON.stringify(valoresFormulario());
        } catch {
            return "";
        }
    }

    function actualizarPreview(ruta) {
        if (!ruta) {
            elementos.imagenPreview.hidden = true;
            elementos.imagenPreview.removeAttribute("src");
            return;
        }
        elementos.imagenPreview.src = rutaImagenParaPanel(ruta);
        elementos.imagenPreview.hidden = false;
    }

    function rellenarFormulario(producto) {
        $("producto-id").value = producto.id || "";
        $("producto-nombre").value = producto.nombre || "";
        $("producto-categoria").value = producto.categoria || "robots";
        $("producto-precio").value = Number.isFinite(producto.precio) ? producto.precio : 0;
        $("producto-precio-anterior").value = Number.isFinite(producto.precioAnterior)
            ? producto.precioAnterior
            : "";
        $("producto-stock").checked = producto.stock === true;
        $("producto-destacado").checked = producto.destacado === true;
        $("producto-activo").checked = producto.activo !== false;
        $("producto-descripcion").value = producto.descripcion || "";
        $("producto-detalle").value = producto.detalle || "";
        $("producto-especificaciones").value = Array.isArray(producto.especificaciones)
            ? producto.especificaciones.join("\n")
            : "";
        $("producto-video").value = producto.video || "";
        $("producto-imagen").value = producto.imagen || "";
        actualizarPreview(producto.imagen || "");
    }

    function abrirFormulario(producto = null) {
        const inicial = producto ? Core.copiar(producto) : Core.productoNuevo();
        state.idEditado = producto ? producto.id : null;
        state.productoBase = producto ? Core.copiar(producto) : null;
        subidaImagen.limpiar();
        state.idAutomatico = !producto;
        elementos.archivoImagen.value = "";
        elementos.archivoNombre.textContent = "JPG, PNG o WEBP. Máximo 3 MB.";
        elementos.subirImagen.disabled = true;
        elementos.erroresProducto.hidden = true;
        elementos.formularioTitulo.textContent = producto ? "Editar producto" : "Nuevo producto";
        rellenarFormulario(inicial);
        state.formularioInicial = serializarFormulario();
        elementos.modalProducto.hidden = false;
        document.body.style.overflow = "hidden";
        setTimeout(() => $("producto-id").focus({ preventScroll: true }), 0);
    }

    async function intentarCerrarFormulario() {
        if (state.operacionActiva) {
            toast("Espera a que termine la operación actual.", "error");
            return;
        }
        if (serializarFormulario() !== state.formularioInicial || subidaImagen.tieneArchivo()) {
            const cerrar = await confirmar(
                "Descartar cambios del formulario",
                "Los cambios que todavía no aplicaste al catálogo se perderán.",
                "Descartar"
            );
            if (!cerrar) return;
        }
        cerrarFormulario();
    }

    function cerrarFormulario() {
        elementos.modalProducto.hidden = true;
        elementos.productoForm.reset();
        state.productoBase = null;
        state.idEditado = null;
        subidaImagen.limpiar();
        document.body.style.overflow = "";
    }

    function mostrarErroresProducto(errores) {
        elementos.erroresProducto.replaceChildren();
        const lista = document.createElement("ul");
        errores.forEach(error => {
            const item = document.createElement("li");
            item.textContent = error;
            lista.appendChild(item);
        });
        elementos.erroresProducto.appendChild(lista);
        elementos.erroresProducto.hidden = false;
    }

    function aplicarProducto(evento) {
        evento.preventDefault();
        if (state.operacionActiva) return;
        const estabaEditando = state.idEditado !== null;
        const producto = valoresFormulario();
        const errores = Core.validarProducto(producto, state.productos, state.idEditado);
        if (errores.length) {
            mostrarErroresProducto(errores);
            return;
        }
        state.productos = Core.guardarLocal(state.productos, producto, state.idEditado);
        marcarCambios(true);
        renderizar();
        cerrarFormulario();
        toast(estabaEditando ? "Producto editado localmente." : "Producto creado localmente.", "exito");
    }

    function alternarActivo(id) {
        state.productos = state.productos.map(producto =>
            producto.id === id
                ? { ...producto, activo: producto.activo === false }
                : producto
        );
        marcarCambios(true);
        renderizar();
        toast("Estado del producto actualizado localmente.", "exito");
    }

    async function solicitarEliminar(producto) {
        const eliminar = await confirmar(
            "Eliminar producto",
            `¿Quieres quitar “${producto.nombre}” del catálogo? La imagen no se eliminará. El cambio será definitivo solo al guardar.`,
            "Eliminar localmente"
        );
        if (!eliminar) return;
        state.productos = Core.eliminarLocal(state.productos, producto.id);
        marcarCambios(true);
        renderizar();
        toast("Producto eliminado localmente.", "exito");
    }

    async function guardarProductos() {
        const errores = state.productos.flatMap((producto, index) =>
            Core.validarProducto(
                producto,
                state.productos.filter((_, otherIndex) => otherIndex !== index),
                null
            )
        );
        if (errores.length) {
            aviso(`No se puede guardar: ${errores[0]}`, "error");
            return;
        }

        establecerOperacion(true);
        aviso("Guardando el catálogo en GitHub…");
        try {
            const resultado = await api("products-save", {
                method: "POST",
                body: JSON.stringify({
                    expectedSha: state.sha,
                    productos: state.productos
                })
            });
            state.sha = resultado.sha;
            marcarCambios(false);
            aviso("Los cambios fueron enviados correctamente a GitHub. Netlify está publicando la nueva versión y puede tardar algunos segundos.");
            toast("Catálogo guardado.", "exito");
        } catch (error) {
            aviso(error.message, "error");
            if (error.details && error.details.length) toast(error.details[0], "error");
        } finally {
            establecerOperacion(false);
        }
    }

    async function recargarProductos() {
        if (state.cambiosPendientes) {
            const recargar = await confirmar(
                "Recargar desde GitHub",
                "Se perderán todos los cambios locales que todavía no guardaste.",
                "Recargar"
            );
            if (!recargar) return;
        }
        await cargarProductos();
    }

    function seleccionarImagen(evento) {
        const archivo = evento.target.files && evento.target.files[0];
        elementos.subirImagen.disabled = true;
        const seleccion = subidaImagen.seleccionar(archivo);

        if (!seleccion.aceptada) {
            if (seleccion.error) toast(seleccion.error, "error");
            elementos.archivoImagen.value = "";
            return;
        }

        elementos.archivoNombre.textContent = `${archivo.name} · ${(archivo.size / 1024).toFixed(0)} KB`;
        elementos.subirImagen.disabled = state.operacionActiva;
        const lector = new FileReader();
        lector.addEventListener("load", () => {
            elementos.imagenPreview.src = lector.result;
            elementos.imagenPreview.hidden = false;
        });
        lector.readAsDataURL(archivo);
    }

    function archivoABase64(archivo) {
        return new Promise((resolve, reject) => {
            const lector = new FileReader();
            lector.addEventListener("load", () => {
                const resultado = String(lector.result);
                resolve(resultado.slice(resultado.indexOf(",") + 1));
            });
            lector.addEventListener("error", () => reject(new Error("No fue posible leer la imagen.")));
            lector.readAsDataURL(archivo);
        });
    }

    async function subirImagen() {
        if (state.operacionActiva || subidaImagen.estaProcesando() || !subidaImagen.tieneArchivo()) {
            return;
        }

        establecerOperacion(true);
        elementos.subirImagen.textContent = "Subiendo…";
        try {
            const resultado = await subidaImagen.subir();
            if (!resultado.iniciada) return;

            Core.asignarRutaImagen($("producto-imagen"), resultado.ruta);
            elementos.imagenPreview.src = resultado.previewUrl;
            elementos.imagenPreview.hidden = false;
            elementos.archivoImagen.value = "";
            elementos.archivoNombre.textContent = "Imagen subida. La ruta se aplicará al guardar el producto.";
            toast(resultado.mensaje, "exito");
        } catch (error) {
            toast(error.message, "error");
        } finally {
            elementos.subirImagen.textContent = "Confirmar y subir imagen";
            establecerOperacion(false);
        }
    }

    function confirmar(titulo, texto, etiquetaAceptar) {
        elementos.confirmacionTitulo.textContent = titulo;
        elementos.confirmacionTexto.textContent = texto;
        elementos.confirmacionAceptar.textContent = etiquetaAceptar;
        elementos.modalConfirmacion.hidden = false;

        return new Promise(resolve => {
            const terminar = resultado => {
                elementos.modalConfirmacion.hidden = true;
                elementos.confirmacionAceptar.removeEventListener("click", aceptar);
                elementos.confirmacionCancelar.removeEventListener("click", cancelar);
                resolve(resultado);
            };
            const aceptar = () => terminar(true);
            const cancelar = () => terminar(false);
            elementos.confirmacionAceptar.addEventListener("click", aceptar);
            elementos.confirmacionCancelar.addEventListener("click", cancelar);
        });
    }

    elementos.loginForm.addEventListener("submit", ingresar);
    elementos.cerrarSesion.addEventListener("click", cerrarSesion);
    elementos.nuevoProducto.addEventListener("click", () => abrirFormulario());
    elementos.recargar.addEventListener("click", recargarProductos);
    elementos.guardar.addEventListener("click", guardarProductos);
    elementos.buscar.addEventListener("input", renderizar);
    elementos.categoria.addEventListener("change", renderizar);
    elementos.productoForm.addEventListener("submit", aplicarProducto);
    elementos.cerrarFormulario.addEventListener("click", intentarCerrarFormulario);
    elementos.cancelarFormulario.addEventListener("click", intentarCerrarFormulario);
    elementos.archivoImagen.addEventListener("change", seleccionarImagen);
    elementos.subirImagen.addEventListener("click", subirImagen);
    $("producto-imagen").addEventListener("input", evento => actualizarPreview(evento.target.value.trim()));
    $("producto-nombre").addEventListener("input", evento => {
        if (!state.idEditado && state.idAutomatico) {
            $("producto-id").value = Core.idDesdeNombre(evento.target.value);
        }
    });
    $("producto-id").addEventListener("input", () => {
        if (!state.idEditado) state.idAutomatico = false;
    });

    elementos.modalProducto.addEventListener("click", evento => {
        if (evento.target === elementos.modalProducto) intentarCerrarFormulario();
    });
    window.addEventListener("keydown", evento => {
        if (evento.key === "Escape" && !elementos.modalProducto.hidden && elementos.modalConfirmacion.hidden) {
            intentarCerrarFormulario();
        }
    });
    window.addEventListener("beforeunload", evento => {
        const formularioAbierto = !elementos.modalProducto.hidden;
        const formularioModificado = formularioAbierto &&
            (
                serializarFormulario() !== state.formularioInicial ||
                subidaImagen.tieneArchivo()
            );
        if (!state.cambiosPendientes && !formularioModificado) return;
        evento.preventDefault();
        evento.returnValue = "";
    });

    iniciar();
})();
