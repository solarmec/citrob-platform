const PRODUCT_CATEGORIES = new Set([
    "robots",
    "makex",
    "arenas",
    "motores",
    "componentes"
]);

const MAX_PRODUCTS = 1000;
const MAX_PRICE = 999_999_999;

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isSafeDisplayText(value, maxLength, allowEmpty = false) {
    return typeof value === "string" &&
        value.length <= maxLength &&
        (allowEmpty || value.trim().length > 0) &&
        !/[<>]/.test(value);
}

function isSafeImagePath(value) {
    if (typeof value !== "string" || value.length === 0 || value.length > 500) {
        return false;
    }

    if (/^\/?imagenes\/[a-zA-Z0-9_./-]+\.(?:jpe?g|png|webp)$/i.test(value)) {
        return !value.includes("..");
    }

    try {
        const url = new URL(value);
        return url.protocol === "https:";
    } catch {
        return false;
    }
}

function isSafeVideo(value) {
    if (value === undefined || value === "") return true;
    if (typeof value !== "string" || value.length > 500) return false;

    try {
        return new URL(value).protocol === "https:";
    } catch {
        return false;
    }
}

function validateProduct(product, index, knownIds, knownNames) {
    const prefix = `Producto ${index + 1}`;
    const errors = [];

    if (!isPlainObject(product)) {
        return [`${prefix}: debe ser un objeto.`];
    }

    if (
        typeof product.id !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.id) ||
        product.id.length > 80
    ) {
        errors.push(`${prefix}: el ID no es válido.`);
    } else if (knownIds.has(product.id)) {
        errors.push(`${prefix}: el ID "${product.id}" está repetido.`);
    } else {
        knownIds.add(product.id);
    }

    if (!isSafeDisplayText(product.nombre, 160)) {
        errors.push(`${prefix}: el nombre es obligatorio y no debe contener HTML.`);
    } else {
        const normalizedName = product.nombre.trim().toLocaleLowerCase("es");
        if (knownNames.has(normalizedName)) {
            errors.push(`${prefix}: el nombre "${product.nombre}" está repetido.`);
        } else {
            knownNames.add(normalizedName);
        }
    }

    if (!PRODUCT_CATEGORIES.has(product.categoria)) {
        errors.push(`${prefix}: la categoría no es válida.`);
    }

    if (!isSafeDisplayText(product.descripcion, 500)) {
        errors.push(`${prefix}: la descripción es obligatoria y no debe contener HTML.`);
    }

    if (!isSafeDisplayText(product.detalle, 5000)) {
        errors.push(`${prefix}: el detalle es obligatorio.`);
    }

    if (
        !Array.isArray(product.especificaciones) ||
        product.especificaciones.length > 50 ||
        product.especificaciones.some(item => !isSafeDisplayText(item, 500))
    ) {
        errors.push(`${prefix}: las especificaciones deben ser una lista de textos válidos.`);
    }

    if (!isSafeVideo(product.video)) {
        errors.push(`${prefix}: el video debe ser una URL HTTPS válida o quedar vacío.`);
    }

    if (
        !Number.isInteger(product.precio) ||
        product.precio < 0 ||
        product.precio > MAX_PRICE
    ) {
        errors.push(`${prefix}: el precio debe ser un entero no negativo.`);
    }

    if (
        product.precioAnterior !== undefined &&
        (
            !Number.isInteger(product.precioAnterior) ||
            product.precioAnterior <= product.precio ||
            product.precioAnterior > MAX_PRICE
        )
    ) {
        errors.push(`${prefix}: el precio anterior debe ser un entero mayor que el precio actual.`);
    }

    if (typeof product.stock !== "boolean") {
        errors.push(`${prefix}: el stock debe indicar disponible o agotado.`);
    }

    if (typeof product.destacado !== "boolean") {
        errors.push(`${prefix}: destacado debe ser verdadero o falso.`);
    }

    if (product.activo !== undefined && typeof product.activo !== "boolean") {
        errors.push(`${prefix}: activo debe ser verdadero o falso.`);
    }

    if (!isSafeImagePath(product.imagen)) {
        errors.push(`${prefix}: la ruta de imagen no es válida.`);
    }

    return errors;
}

function validateProducts(products) {
    if (!Array.isArray(products)) {
        return { valid: false, errors: ["Productos debe ser un arreglo."] };
    }

    if (products.length === 0 || products.length > MAX_PRODUCTS) {
        return {
            valid: false,
            errors: [`El catálogo debe contener entre 1 y ${MAX_PRODUCTS} productos.`]
        };
    }

    const knownIds = new Set();
    const knownNames = new Set();
    const errors = products.flatMap((product, index) =>
        validateProduct(product, index, knownIds, knownNames)
    );

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    PRODUCT_CATEGORIES,
    validateProducts
};
