import { conectividad } from "../control/conectividad.js";

const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/aviso_sin_conexion.css">
    <div class="bloqueo" hidden></div>
    <div class="aviso" role="status" aria-live="polite" hidden>
        <span class="icono" aria-hidden="true">⚠</span>
        <p class="texto">Sin conexión con el backend. No hay datos disponibles. No puede buscar citas ni atender consultas hasta que vuelva la conexión.</p>
    </div>
`;

class AvisoSinConexion extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
        this.aviso = this.root.querySelector(".aviso");
        this.bloqueo = this.root.querySelector(".bloqueo");
        this.alCambiar = evento => this.actualizar({ conectado: evento.detail.conectado });
    }

    connectedCallback() {
        conectividad.addEventListener("cambio", this.alCambiar);
        this.actualizar({ conectado: conectividad.conectado });
    }

    disconnectedCallback() {
        conectividad.removeEventListener("cambio", this.alCambiar);
    }

    actualizar(estado) {
        if (!estado || typeof estado.conectado !== "boolean") {
            return;
        }
        let desconectado = !estado.conectado;
        this.aviso.hidden = !desconectado;
        this.bloqueo.hidden = !desconectado;
    }
}
customElements.define("aviso-sin-conexion", AvisoSinConexion);
export default AvisoSinConexion;
