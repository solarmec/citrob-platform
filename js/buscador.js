const buscador = document.getElementById("buscador");
const resultadosBusqueda = document.getElementById("resultados-busqueda");

function mostrarResultadosBusqueda() {
    const texto = buscador.value.toLowerCase().trim();

    resultadosBusqueda.innerHTML = "";

    if (texto === "") {
        resultadosBusqueda.style.display = "none";
        return;
    }

    const resultados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(texto) ||
        producto.descripcion.toLowerCase().includes(texto)
    );

    if (resultados.length === 0) {
        resultadosBusqueda.innerHTML = `
            <div class="resultado-item">
                <p>No se encontraron productos.</p>
            </div>
        `;
        resultadosBusqueda.style.display = "block";
        return;
    }

    resultados.slice(0, 6).forEach(producto => {
        const item = document.createElement("div");
        item.className = "resultado-item";

        item.innerHTML = `
            <h4>${producto.nombre}</h4>
            <p>${producto.descripcion}</p>
            <strong>${formatearPrecio(producto.precio)}</strong>
        `;

        item.addEventListener("click", () => {
            agregarAlCarrito(producto.nombre);
            resultadosBusqueda.style.display = "none";
            buscador.value = "";
            mostrarProductos();
        });

        resultadosBusqueda.appendChild(item);
    });

    resultadosBusqueda.style.display = "block";
}

function configurarBuscador() {
    buscador.addEventListener("input", () => {
        mostrarProductos();
        mostrarResultadosBusqueda();
    });

    document.addEventListener("click", (evento) => {
        if (!evento.target.closest(".busqueda-contenedor")) {
            resultadosBusqueda.style.display = "none";
        }
    });
}