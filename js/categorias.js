const botonesCategoria = document.querySelectorAll(".categoria");
let categoriaActual = "todos";

function configurarCategorias() {
    botonesCategoria.forEach(boton => {
        boton.addEventListener("click", () => {
            botonesCategoria.forEach(b => b.classList.remove("activa"));
            boton.classList.add("activa");

            categoriaActual = boton.dataset.categoria;
            tituloCategoria.textContent = boton.textContent.trim();

            mostrarProductos();
        });
    });
}