"use strict";

const { createPasswordHash } = require("../netlify/functions/_lib/auth");

function leerSecreto(mensaje) {
    if (!process.stdin.isTTY) {
        throw new Error("Ejecuta este comando en una terminal interactiva.");
    }

    return new Promise(resolve => {
        let valor = "";
        process.stdout.write(mensaje);
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding("utf8");

        const recibir = tecla => {
            if (tecla === "\u0003") process.exit(130);
            if (tecla === "\r" || tecla === "\n") {
                process.stdin.setRawMode(false);
                process.stdin.pause();
                process.stdin.removeListener("data", recibir);
                process.stdout.write("\n");
                resolve(valor);
                return;
            }
            if (tecla === "\u007f" || tecla === "\b") {
                if (valor.length) {
                    valor = valor.slice(0, -1);
                    process.stdout.write("\b \b");
                }
                return;
            }
            if (tecla >= " ") {
                valor += tecla;
                process.stdout.write("•");
            }
        };
        process.stdin.on("data", recibir);
    });
}

async function main() {
    const password = await leerSecreto("Contraseña administrativa (mínimo 12 caracteres): ");
    const confirmation = await leerSecreto("Repite la contraseña: ");

    if (password !== confirmation) {
        throw new Error("Las contraseñas no coinciden.");
    }

    const hash = await createPasswordHash(password);
    process.stdout.write("\nCopia este valor en ADMIN_PASSWORD_HASH de Netlify:\n");
    process.stdout.write(`${hash}\n`);
}

main().catch(error => {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
});
