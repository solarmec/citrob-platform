const abrirCarrito = document.getElementById("abrir-carrito");
const cerrarCarrito = document.getElementById("cerrar-carrito");
const btnWhatsapp = document.getElementById("btn-whatsapp");

function iniciarPagina() {
    mostrarDestacados();
    mostrarProductos();
    actualizarCarrito();

    configurarCategorias();
    configurarBuscador();

    abrirCarrito.addEventListener("click", abrirPanelCarrito);
    cerrarCarrito.addEventListener("click", cerrarPanelCarrito);
    fondoCarrito.addEventListener("click", cerrarPanelCarrito);

    btnWhatsapp.addEventListener("click", enviarPedido);
}

iniciarPagina();