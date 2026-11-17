import { MENSAJE_ESTADO_BACKEND } from "../model/config.js";

const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/aviso_sin_conexion.css">
    <div class="aviso" role="status" aria-live="polite" hidden>
        <span class="icono" aria-hidden="true">⚠</span>
        <p class="texto">Sin conexión con el backend. Solo puede consultar datos guardados en caché; no se podrán guardar cambios hasta que vuelva.</p>
    </div>
`;

/**
 * <aviso-sin-conexion>
 * Aviso global que activa el service worker cuando la API se sirve desde caché.
 */
class AvisoSinConexion extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
        this.aviso = this.root.querySelector(".aviso");
        this.alCambiar = evento => {
            let datos = evento.data;
            if (datos && datos.tipo === MENSAJE_ESTADO_BACKEND) {
                this.actualizar(datos);
            }
        };
    }

    connectedCallback() {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.addEventListener("message", this.alCambiar);
        }
    }

    disconnectedCallback() {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.removeEventListener("message", this.alCambiar);
        }
    }

    actualizar(estado) {
        if (!estado || typeof estado.conectado !== "boolean") {
            return;
        }
        this.aviso.hidden = estado.conectado;
    }
}
customElements.define("aviso-sin-conexion", AvisoSinConexion);
export default AvisoSinConexion;
