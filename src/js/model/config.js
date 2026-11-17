/**
 * Configuración compartida por la aplicación y el service worker.
 * La URL del backend vive en un solo lugar para no tener que cambiarla en dos
 * archivos cuando se despliega en otro puerto o servidor.
 */
export const URL_API = "http://localhost:9080/GalenoSV-1.0-SNAPSHOT/resources/";
export const MENSAJE_ESTADO_BACKEND = "galeno-estado-backend";
