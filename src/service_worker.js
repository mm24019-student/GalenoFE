// Service worker de GalenoFE.
// - Al instalarse guarda TODA la app (precache), asi abre sin servidor.
// - Archivos de la app: primero la red, y si falla lo guardado.
// - GET de la API REST: primero la red, y si el backend esta apagado, lo ultimo consultado.
import { URL_API } from "./js/model/config.js";

const CACHE = "galeno-fe-v7";
const CACHE_API = "galeno-api-v1";

// Rutas relativas a este archivo (src/)
const ARCHIVOS = [
    "./",
    "index.html",
    "manifest.json",
    "recursos/estilos/principal.css",
    "recursos/estilos/compartido/base_componentes.css",
    "recursos/estilos/componentes/arbol_pasos.css",
    "recursos/estilos/componentes/consulta_dashboard.css",
    "recursos/estilos/componentes/galeno_layout.css",
    "recursos/estilos/componentes/galeno_nav.css",
    "recursos/estilos/componentes/mensaje_panel.css",
    "recursos/estilos/componentes/pagina_base.css",
    "recursos/estilos/componentes/selector_documento.css",
    "recursos/estilos/componentes/tarjeta_cita.css",
    "recursos/estilos/componentes/tarjeta_consulta.css",
    "recursos/estilos/paginas/pagina_atencion.css",
    "recursos/estilos/paginas/pagina_busqueda_citas.css",
    "recursos/estilos/paginas/pagina_dashboard.css",
    "recursos/estilos/paginas/pagina_login.css",
    "recursos/iconos/icono-192.png",
    "recursos/iconos/icono-512.png",
    "recursos/iconos/icono-192-maskable.png",
    "recursos/iconos/icono-512-maskable.png",
    "js/boundary/arbol_pasos.js",
    "js/boundary/galeno_app.js",
    "js/boundary/galeno_layout.js",
    "js/boundary/galeno_nav.js",
    "js/boundary/galeno_router.js",
    "js/boundary/instalar_app.js",
    "js/boundary/mensaje_panel.js",
    "js/boundary/pagina_atencion.js",
    "js/boundary/pagina_base.js",
    "js/boundary/pagina_busqueda_citas.js",
    "js/boundary/pagina_dashboard.js",
    "js/boundary/pagina_login.js",
    "js/boundary/pagina_no_encontrada.js",
    "js/boundary/selector_documento.js",
    "js/boundary/tarjeta_cita.js",
    "js/boundary/tarjeta_consulta.js",
    "js/control/clinica_service.js",
    "js/control/consulta_procedimiento_paso_service.js",
    "js/control/consulta_procedimiento_service.js",
    "js/control/consulta_service.js",
    "js/control/default_service.js",
    "js/control/documento_service.js",
    "js/control/examen_resultado_service.js",
    "js/control/examen_service.js",
    "js/control/examen_tipo_examen_service.js",
    "js/control/identidad.js",
    "js/control/medio_contacto_service.js",
    "js/control/orden_examen_service.js",
    "js/control/persona_rol_service.js",
    "js/control/persona_service.js",
    "js/control/procedimiento_paso_examen_service.js",
    "js/control/procedimiento_paso_secuencia_service.js",
    "js/control/procedimiento_paso_service.js",
    "js/control/procedimiento_service.js",
    "js/control/rol_service.js",
    "js/control/sesion.js",
    "js/control/tipo_documento_service.js",
    "js/control/tipo_examen_service.js",
    "js/control/tipo_medio_contacto_service.js",
    "js/entity/default_error.js",
    "js/entity/default_response.js",
    "js/model/atencion.js",
    "js/model/citas.js",
    "js/model/config.js",
    "js/model/fechas.js",
    "js/model/ids.js",
    "js/model/rutas.js",
    "js/model/secuencia.js"
];

self.addEventListener("install", evento => {
    evento.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(ARCHIVOS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", evento => {
    evento.waitUntil(
        caches.keys()
            .then(nombres => Promise.all(
                nombres.filter(n => n !== CACHE && n !== CACHE_API).map(n => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

// Intenta la red; si funciona guarda una copia, si falla devuelve la copia guardada.
function redPrimero(peticion, nombreCache, alFallar) {
    return fetch(peticion).then(respuesta => {
        if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(nombreCache).then(cache => cache.put(peticion, copia));
        }
        return respuesta;
    }).catch(() => caches.open(nombreCache)
        .then(cache => cache.match(peticion))
        .then(guardada => guardada || alFallar()));
}

self.addEventListener("fetch", evento => {
    const peticion = evento.request;
    const url = new URL(peticion.url);

    // Solo se atienden los GET (POST, PUT y DELETE van siempre a la red)
    if (peticion.method !== "GET") {
        return;
    }

    // API REST
    if (peticion.url.startsWith(URL_API)) {
        evento.respondWith(redPrimero(peticion, CACHE_API, () => Response.error()));
        return;
    }

    // Archivos de la aplicacion (mismo origen); BrowserSync pasa directo a la red
    if (url.origin !== self.location.origin
            || url.pathname.startsWith("/browser-sync")) {
        return;
    }
    evento.respondWith(
        redPrimero(peticion, CACHE, () =>
            // Sin red y sin copia: cualquier navegacion (/src/, /src/index.html, etc.) abre index.html.
            // Un script o css que falta debe fallar de verdad (devolver HTML rompe los modulos).
            peticion.mode === "navigate"
                ? caches.match("index.html").then(inicio => inicio || Response.error())
                : Response.error())
    );
});