const catalogo = document.getElementById("contenedor-productos");
const productosDestacados = document.getElementById("productos-destacados");
const cantidadProductos = document.getElementById("cantidad-productos");
const tituloCategoria = document.getElementById("titulo-categoria");
const listaCarrito = document.getElementById("lista-carrito");
const totalCarrito = document.getElementById("total-carrito");
const contadorCarrito = document.getElementById("contador-carrito");
const panelCarrito = document.getElementById("panel-carrito");
const fondoCarrito = document.getElementById("fondo-carrito");

const modalProducto = document.getElementById("modal-producto");
const cerrarModal = document.getElementById("cerrar-modal");
const modalImagen = document.getElementById("modal-imagen");
const modalCategoria = document.getElementById("modal-categoria");
const modalNombre = document.getElementById("modal-nombre");
const modalStock = document.getElementById("modal-stock");
const modalPrecioAnterior = document.getElementById("modal-precio-anterior");
const modalPrecio = document.getElementById("modal-precio");
const modalDescripcion = document.getElementById("modal-descripcion");
const modalEspecificaciones = document.getElementById("modal-especificaciones");
const modalAgregar = document.getElementById("modal-agregar");

function formatearPrecio(precio) {
    if (precio === 0) return "Consultar";
    return "$" + precio.toLocaleString("es-CL");
}

function tienePrecioAnteriorValido(producto) {
    return Number.isFinite(producto.precioAnterior) &&
        producto.precioAnterior > producto.precio;
}

function tieneImagen(producto) {
    return producto.imagen && producto.imagen.trim() !== "";
}

function crearTarjetaProducto(producto) {
    const tarjeta = document.createElement("div");
    tarjeta.className = "producto";

    tarjeta.innerHTML = `
        ${tieneImagen(producto)
            ? `<img src="${producto.imagen}" alt="${producto.nombre}" class="imagen-producto">`
            : `<div class="imagen-placeholder">Producto</div>`
        }

        <h3>${producto.nombre}</h3>
        <p class="descripcion">${producto.descripcion}</p>

        <p class="stock ${producto.stock ? "disponible" : "agotado"}">
            ${producto.stock ? "Disponible" : "Agotado"}
        </p>

        ${tienePrecioAnteriorValido(producto)
            ? `<p class="precio-anterior">${formatearPrecio(producto.precioAnterior)}</p>`
            : ""
        }
        <p class="precio">${formatearPrecio(producto.precio)}</p>

        <button class="btn-agregar" ${producto.stock ? "" : "disabled"}>
            ${producto.stock ? "Agregar al carro" : "Sin stock"}
        </button>
    `;

    tarjeta.addEventListener("click", (evento) => {
        if (evento.target.closest("button")) return;
        abrirModalProducto(producto.nombre);
    });

    const boton = tarjeta.querySelector(".btn-agregar");
    boton.addEventListener("click", () => agregarAlCarrito(producto.nombre));

    return tarjeta;
}

function mostrarProductos() {
    catalogo.innerHTML = "";

    const textoBusqueda = buscador.value.toLowerCase();

    const productosFiltrados = productos.filter(producto => {
        const coincideCategoria =
            categoriaActual === "todos" || producto.categoria === categoriaActual;

        const coincideBusqueda =
            producto.nombre.toLowerCase().includes(textoBusqueda) ||
            producto.descripcion.toLowerCase().includes(textoBusqueda);

        return coincideCategoria && coincideBusqueda;
    });

    cantidadProductos.textContent = productosFiltrados.length + " productos";

    productosFiltrados.forEach(producto => {
        catalogo.appendChild(crearTarjetaProducto(producto));
    });
}

function mostrarDestacados() {
    productosDestacados.innerHTML = "";

    const destacados = productos.filter(producto => producto.destacado === true);

    destacados.forEach(producto => {
        productosDestacados.appendChild(crearTarjetaProducto(producto));
    });
}

function actualizarCarrito() {
    listaCarrito.innerHTML = "";

    let total = 0;
    let cantidadTotal = 0;

    carrito.forEach(producto => {
        total += producto.precio * producto.cantidad;
        cantidadTotal += producto.cantidad;

        const item = document.createElement("div");
        item.className = "item-carrito";

        item.innerHTML = `
            ${tieneImagen(producto)
                ? `<img src="${producto.imagen}" alt="${producto.nombre}" class="mini-imagen-producto">`
                : `<div class="mini-imagen">IMG</div>`
            }

            <div class="detalle-carrito">
                <h3>${producto.nombre}</h3>
                <p>${formatearPrecio(producto.precio * producto.cantidad)}</p>

                <div class="controles-carrito">
                    <button class="btn-disminuir">−</button>
                    <span>${producto.cantidad}</span>
                    <button class="btn-aumentar">+</button>
                    <button class="btn-eliminar">Eliminar</button>
                </div>
            </div>
        `;

        item.querySelector(".btn-disminuir").addEventListener("click", () => disminuirCantidad(producto.nombre));
        item.querySelector(".btn-aumentar").addEventListener("click", () => aumentarCantidad(producto.nombre));
        item.querySelector(".btn-eliminar").addEventListener("click", () => eliminarProducto(producto.nombre));

        listaCarrito.appendChild(item);
    });

    totalCarrito.textContent = "Total: " + formatearPrecio(total);
    contadorCarrito.textContent = cantidadTotal;
}

function abrirPanelCarrito() {
    panelCarrito.classList.add("abierto");
    fondoCarrito.classList.add("abierto");
}

function cerrarPanelCarrito() {
    panelCarrito.classList.remove("abierto");
    fondoCarrito.classList.remove("abierto");
}

function abrirModalProducto(nombreProducto) {
    const producto = productos.find(p => p.nombre === nombreProducto);
    if (!producto) return;

    modalNombre.textContent = producto.nombre;
    modalCategoria.textContent = producto.categoria.toUpperCase();
    modalStock.textContent = producto.stock ? "Disponible" : "Agotado";
    modalStock.className = producto.stock ? "modal-stock disponible" : "modal-stock agotado";

    if (tienePrecioAnteriorValido(producto)) {
        modalPrecioAnterior.textContent = formatearPrecio(producto.precioAnterior);
        modalPrecioAnterior.hidden = false;
    } else {
        modalPrecioAnterior.textContent = "";
        modalPrecioAnterior.hidden = true;
    }

    modalPrecio.textContent = formatearPrecio(producto.precio);
    modalDescripcion.textContent = producto.detalle || producto.descripcion;

    if (tieneImagen(producto)) {
        modalImagen.src = producto.imagen;
        modalImagen.style.display = "block";
    } else {
        modalImagen.style.display = "none";
    }

    modalEspecificaciones.innerHTML = "";

    if (producto.especificaciones && producto.especificaciones.length > 0) {
        producto.especificaciones.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            modalEspecificaciones.appendChild(li);
        });
    } else {
        const li = document.createElement("li");
        li.textContent = "Ficha técnica en actualización.";
        modalEspecificaciones.appendChild(li);
    }

    modalAgregar.disabled = !producto.stock;
    modalAgregar.textContent = producto.stock ? "Agregar al carro" : "Sin stock";

    let botonVideo = document.getElementById("modal-video");

if (!botonVideo) {
    botonVideo = document.createElement("a");
    botonVideo.id = "modal-video";
    botonVideo.className = "modal-video";
    botonVideo.textContent = "▶ Ver video demostrativo";
    botonVideo.target = "_blank";

    modalAgregar.parentNode.insertBefore(botonVideo, modalAgregar);
}

if (producto.video && producto.video.trim() !== "") {
    botonVideo.href = producto.video;
    botonVideo.style.display = "block";
} else {
    botonVideo.style.display = "none";
}

    modalAgregar.onclick = () => {
        agregarAlCarrito(producto.nombre);
        cerrarModalProducto();
    };

    modalProducto.classList.add("abierto");
}

function cerrarModalProducto() {
    modalProducto.classList.remove("abierto");
}

cerrarModal.addEventListener("click", cerrarModalProducto);

modalProducto.addEventListener("click", (evento) => {
    if (evento.target === modalProducto) {
        cerrarModalProducto();
    }
});
