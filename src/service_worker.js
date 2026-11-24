import { URL_API, MENSAJE_ESTADO_BACKEND, MENSAJE_CONFIGURAR_API } from "./js/model/config.js";

const CACHE = "galeno-fe-v25";
const CACHE_API = "galeno-api-v1";
let urlApi = URL_API;

self.addEventListener("message", evento => {
    let datos = evento.data;
    if (datos && datos.tipo === MENSAJE_CONFIGURAR_API
            && typeof datos.url === "string" && datos.url.trim()) {
        urlApi = datos.url.trim().replace(/\/+$/, "") + "/";
    }
});

const ARCHIVOS = [
    "./",
    "index.html",
    "manifest.json",
    "recursos/estilos/principal.css",
    "recursos/estilos/compartido/base_componentes.css",
    "recursos/estilos/componentes/arbol_pasos.css",
    "recursos/estilos/componentes/aviso_instalar_app.css",
    "recursos/estilos/componentes/aviso_sin_conexion.css",
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
    "recursos/iconos/logoGaleno2609.png",
    "recursos/capturas/escritorio.png",
    "recursos/capturas/movil.png",
    "js/boundary/arbol_pasos.js",
    "js/boundary/aviso_instalar_app.js",
    "js/boundary/aviso_sin_conexion.js",
    "js/boundary/galeno_app.js",
    "js/boundary/galeno_layout.js",
    "js/boundary/galeno_nav.js",
    "js/boundary/galeno_router.js",
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
    "js/control/conectividad.js",
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
                nombres.filter(n => n !== CACHE).map(n => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});

function avisarEstado(conectado) {
    if (!self.clients) {
        return;
    }
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
        .then(clientes => clientes.forEach(cliente =>
            cliente.postMessage({ tipo: MENSAJE_ESTADO_BACKEND, conectado: conectado })))
        .catch(() => {});
}

function redApi(peticion) {
    return fetch(peticion).then(respuesta => {
        avisarEstado(true);
        return respuesta;
    }).catch(() => {
        avisarEstado(false);
        return Response.error();
    });
}

function redPrimero(peticion, alFallar) {
    return fetch(peticion).then(respuesta => {
        if (respuesta.ok && respuesta.type === "basic") {
            const copia = respuesta.clone();
            caches.open(CACHE).then(cache => cache.put(peticion, copia));
        }
        return respuesta;
    }).catch(() => caches.match(peticion).then(guardada => guardada || alFallar()));
}

self.addEventListener("fetch", evento => {
    const peticion = evento.request;
    const url = new URL(peticion.url);

    if (peticion.method !== "GET") {
        return;
    }

    if (peticion.url.startsWith(urlApi)) {
        evento.respondWith(redApi(peticion));
        return;
    }

    if (url.origin !== self.location.origin
            || url.pathname.startsWith("/browser-sync")) {
        return;
    }
    evento.respondWith(
        redPrimero(peticion, () =>
            peticion.mode === "navigate"
                ? caches.match("index.html").then(inicio => inicio || Response.error())
                : Response.error())
    );
});
