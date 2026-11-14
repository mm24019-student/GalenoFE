export function nuevoId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
        return globalThis.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, caracter => {
        let aleatorio = Math.random() * 16 | 0;
        let valor = caracter === "x" ? aleatorio : (aleatorio & 0x3 | 0x8);
        return valor.toString(16);
    });
}
