// Genera los iconos de la aplicacion (PNG) sin librerias: solo modulos incluidos en Node.
// Uso:  node generar_iconos.mjs      (desde la carpeta raiz de GalenoFE)
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const COLOR_FONDO = [0, 123, 255];   // --color-principal (#007bff)
const COLOR_DIENTE = [255, 255, 255];

// --- forma del diente en coordenadas de 0 a 1 ---
const circulo = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
const rectangulo = (x, y, x1, y1, x2, y2) => x >= x1 && x <= x2 && y >= y1 && y <= y2;
function triangulo(x, y, [ax, ay], [bx, by], [cx, cy]) {
    const d = (px, py, qx, qy, rx, ry) => (px - rx) * (qy - ry) - (qx - rx) * (py - ry);
    const d1 = d(x, y, ax, ay, bx, by), d2 = d(x, y, bx, by, cx, cy), d3 = d(x, y, cx, cy, ax, ay);
    return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}
function esDiente(x, y) {
    return circulo(x, y, 0.40, 0.38, 0.14) || circulo(x, y, 0.60, 0.38, 0.14)
        || rectangulo(x, y, 0.26, 0.38, 0.74, 0.52)
        || triangulo(x, y, [0.30, 0.50], [0.49, 0.50], [0.40, 0.78])
        || triangulo(x, y, [0.51, 0.50], [0.70, 0.50], [0.60, 0.78]);
}

// --- PNG ---
const tablaCrc = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});
function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (const b of buf) c = tablaCrc[(c ^ b) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
}
function bloque(tipo, datos) {
    const largo = Buffer.alloc(4);
    largo.writeUInt32BE(datos.length);
    const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(cuerpo));
    return Buffer.concat([largo, cuerpo, crc]);
}
function crearPng(tam, escala = 1) {
    const filas = [];
    const S = 3; // 3x3 muestras por pixel para suavizar los bordes
    for (let py = 0; py < tam; py++) {
        const fila = Buffer.alloc(1 + tam * 3);
        for (let px = 0; px < tam; px++) {
            let dentro = 0;
            for (let sy = 0; sy < S; sy++)
                for (let sx = 0; sx < S; sx++) {
                    const x = (px + (sx + 0.5) / S) / tam;
                    const y = (py + (sy + 0.5) / S) / tam;
                    // escala < 1 deja el dibujo dentro de la zona segura del icono maskable
                    if (esDiente((x - 0.5) / escala + 0.5, (y - 0.5) / escala + 0.5)) dentro++;
                }
            const t = dentro / (S * S);
            for (let k = 0; k < 3; k++)
                fila[1 + px * 3 + k] = Math.round(COLOR_FONDO[k] * (1 - t) + COLOR_DIENTE[k] * t);
        }
        filas.push(fila);
    }
    const cabecera = Buffer.alloc(13);
    cabecera.writeUInt32BE(tam, 0);
    cabecera.writeUInt32BE(tam, 4);
    cabecera[8] = 8;  // 8 bits por canal
    cabecera[9] = 2;  // RGB
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
        bloque("IHDR", cabecera),
        bloque("IDAT", deflateSync(Buffer.concat(filas))),
        bloque("IEND", Buffer.alloc(0))
    ]);
}

mkdirSync("src/recursos/iconos", { recursive: true });
for (const tam of [192, 512]) {
    writeFileSync(`src/recursos/iconos/icono-${tam}.png`, crearPng(tam));
    writeFileSync(`src/recursos/iconos/icono-${tam}-maskable.png`, crearPng(tam, 0.8));
    console.log(`creado src/recursos/iconos/icono-${tam}.png`);
    console.log(`creado src/recursos/iconos/icono-${tam}-maskable.png`);
}