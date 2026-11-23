/**
 * Configuración compartida por la aplicación y el service worker.
 * La URL del backend vive en un solo lugar para no tener que cambiarla en dos
 * archivos cuando se despliega en otro puerto o servidor.
 */
export const MENSAJE_ESTADO_BACKEND = "galeno-estado-backend";
export const MENSAJE_CONFIGURAR_API = "galeno-configurar-api";

const API_POR_DEFECTO = "http://galeno.backend:9080/galeno/resources/";

function normalizar(url) {
    return String(url).trim().replace(/\/+$/, "") + "/";
}

export const URL_API = normalizar(
    (typeof globalThis.GALENO_URL_API === "string" && globalThis.GALENO_URL_API.trim())
        ? globalThis.GALENO_URL_API
        : API_POR_DEFECTO
);
