// Punto de entrada: al importar cada archivo se registra su componente (customElements.define)
import "./pagina_busqueda_citas.js";
import "./pagina_login.js";
import "./pagina_dashboard.js";
import "./pagina_atencion.js";
import "./pagina_no_encontrada.js";
import "./galeno_router.js";
import "./galeno_nav.js";
import "./galeno_layout.js";

// PWA: el service worker permite instalar la aplicacion y abrirla sin conexion
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service_worker.js", { type: "module" })
        .catch(error => console.error("No se pudo registrar el service worker", error));
}