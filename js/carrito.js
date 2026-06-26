let carrito = [];

function agregarAlCarrito(nombreProducto) {
    const producto = productos.find(p => p.nombre === nombreProducto);
    const productoEnCarrito = carrito.find(p => p.nombre === nombreProducto);

    if (!producto) return;

    if (productoEnCarrito) {
        productoEnCarrito.cantidad++;
    } else {
        carrito.push({
            ...producto,
            cantidad: 1
        });
    }

    actualizarCarrito();
    abrirPanelCarrito();
}

function aumentarCantidad(nombreProducto) {
    const productoEnCarrito = carrito.find(p => p.nombre === nombreProducto);

    if (productoEnCarrito) {
        productoEnCarrito.cantidad++;
    }

    actualizarCarrito();
}

function disminuirCantidad(nombreProducto) {
    const productoEnCarrito = carrito.find(p => p.nombre === nombreProducto);

    if (productoEnCarrito) {
        productoEnCarrito.cantidad--;

        if (productoEnCarrito.cantidad <= 0) {
            carrito = carrito.filter(p => p.nombre !== nombreProducto);
        }
    }

    actualizarCarrito();
}

function eliminarProducto(nombreProducto) {
    carrito = carrito.filter(p => p.nombre !== nombreProducto);
    actualizarCarrito();
}

function enviarPedido() {
    if (carrito.length === 0) {
        alert("El carrito está vacío");
        return;
    }

    const nombreCliente = document.getElementById("cliente-nombre").value;
    const colegioCliente = document.getElementById("cliente-colegio").value;
    const direccionCliente = document.getElementById("cliente-direccion").value;
    const correoCliente = document.getElementById("cliente-correo").value;
    const telefonoCliente = document.getElementById("cliente-telefono").value;

    if (
        nombreCliente.trim() === "" ||
        correoCliente.trim() === "" ||
        telefonoCliente.trim() === ""
    ) {
        alert("Por favor ingresa nombre, correo y teléfono antes de enviar.");
        return;
    }

    let mensaje = "Hola CITROB, quisiera cotizar:%0A%0A";

    mensaje += `Nombre: ${nombreCliente}%0A`;
    mensaje += `Colegio/Institución: ${colegioCliente}%0A`;
    mensaje += `Dirección: ${direccionCliente}%0A`;
    mensaje += `Correo: ${correoCliente}%0A`;
    mensaje += `Teléfono: ${telefonoCliente}%0A%0A`;
    mensaje += `Productos:%0A`;

    carrito.forEach(producto => {
        mensaje += `- ${producto.nombre} x ${producto.cantidad}: ${formatearPrecio(producto.precio * producto.cantidad)}%0A`;
    });

    const total = carrito.reduce((suma, producto) => {
        return suma + producto.precio * producto.cantidad;
    }, 0);

    mensaje += `%0ATotal referencial: ${formatearPrecio(total)}`;

    const telefono = "56981533101";
    const url = `https://wa.me/${telefono}?text=${mensaje}`;

    window.open(url, "_blank");
}