let carrito = [];

function agregarAlCarrito(nombreProducto) {
    const producto = productos.find(p =>
        p.nombre === nombreProducto && p.activo !== false
    );
    const productoEnCarrito = carrito.find(p => p.nombre === nombreProducto);

    if (!producto || !producto.stock) return;

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

    let mensaje = "Hola CITROB, quisiera cotizar:\n\n";

    mensaje += `Nombre: ${nombreCliente}\n`;
    mensaje += `Colegio/Institución: ${colegioCliente}\n`;
    mensaje += `Dirección: ${direccionCliente}\n`;
    mensaje += `Correo: ${correoCliente}\n`;
    mensaje += `Teléfono: ${telefonoCliente}\n\n`;
    mensaje += "Productos:\n";

    carrito.forEach(producto => {
        mensaje += `- ${producto.nombre} x ${producto.cantidad}: ${formatearPrecio(producto.precio * producto.cantidad)}\n`;
    });

    const total = carrito.reduce((suma, producto) => {
        return suma + producto.precio * producto.cantidad;
    }, 0);

    mensaje += `\nTotal referencial: ${formatearPrecio(total)}`;

    const telefono = "56981533101";
    const url = construirUrlWhatsapp(telefono, mensaje);

    window.open(url, "_blank");
}
