import { formatearFecha } from "../model/fechas.js";
import { nombreClinica } from "../model/citas.js";

const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/tarjeta_cita.css">
    <article>
        <header>
            <h3 id="referencia">Consulta</h3>
            <div class="fecha" id="fecha"></div>
            <div class="clinica" id="clinica"></div>
        </header>
        <section>
            <h4>Procedimientos</h4>
            <ul id="procedimientos"></ul>
        </section>
        <footer>
            <button id="ticket" type="button">Descargar comprobante PDF</button>
        </footer>
    </article>
`;

/**
 * <tarjeta-cita>
 * Card de una cita con fecha/hora, clinica y procedimientos. Emite el evento
 * "descargar-ticket" con el id de la consulta cuando se pide el PDF.
 */
class TarjetaCita extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
        this._cita = null;
        this._procedimientos = [];
        this.root.querySelector("#ticket").addEventListener("click", () => {
            if (this._cita) {
                this.dispatchEvent(new CustomEvent("descargar-ticket", {
                    bubbles: true,
                    composed: true,
                    detail: { cita: this._cita }
                }));
            }
        });
    }

    set cita(valor) {
        this._cita = valor;
        this.pintar();
    }

    get cita() {
        return this._cita;
    }

    set procedimientos(valor) {
        this._procedimientos = valor || [];
        this.pintar();
    }

    pintar() {
        if (!this._cita) {
            return;
        }
        let pr = this._cita.idPersonaRol || {};
        this.root.querySelector("#referencia").textContent =
            "Consulta " + (this._cita.referenciaExterna || "sin referencia");
        this.root.querySelector("#fecha").textContent = formatearFecha(this._cita.fechaInicio);
        this.root.querySelector("#clinica").textContent = nombreClinica(pr) || "Clínica no indicada";
        let lista = this.root.querySelector("#procedimientos");
        if (this._procedimientos.length === 0) {
            let li = document.createElement("li");
            li.className = "vacio";
            li.textContent = "Sin procedimientos registrados";
            lista.replaceChildren(li);
        } else {
            lista.replaceChildren(...this._procedimientos.map(nombre => {
                let li = document.createElement("li");
                li.textContent = nombre;
                return li;
            }));
        }
    }
}
customElements.define("tarjeta-cita", TarjetaCita);
export default TarjetaCita;
