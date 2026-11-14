import "./arbol_pasos.js";
import { formatearFecha, formatearSoloFecha } from "../model/fechas.js";
import { nombreClinica, nombreCompleto, nombreRol } from "../model/citas.js";

const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/tarjeta_consulta.css">
    <article>
        <header>
            <div>
                <h3 id="titulo"></h3>
                <p class="sub" id="subtitulo"></p>
            </div>
            <div class="sub" id="inicio"></div>
        </header>
        <div class="datos" id="datos"></div>
        <section class="procedimientos">
            <h4>Procedimientos y pasos</h4>
            <div id="listaProcedimientos"></div>
        </section>
        <footer>
            <button id="atender" type="button">Atender consulta</button>
        </footer>
    </article>
`;

/**
 * <tarjeta-consulta>
 * Card del dashboard. Muestra los datos generales del paciente, la fecha de
 * inicio y los procedimientos con sus pasos jerárquicos. `detalle` debe tener
 * la forma { procedimientos: [{ id, nombre, fechaInicio, pasos, orden }] }.
 */
class TarjetaConsulta extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
        this._consulta = null;
        this._detalle = null;
        this.root.querySelector("#atender").addEventListener("click", () => {
            if (this._consulta) {
                this.dispatchEvent(new CustomEvent("atender", {
                    bubbles: true,
                    composed: true,
                    detail: { consulta: this._consulta }
                }));
            }
        });
    }

    set consulta(valor) {
        this._consulta = valor;
        this.pintar();
    }

    get consulta() {
        return this._consulta;
    }

    set detalle(valor) {
        this._detalle = valor;
        this.pintar();
    }

    pintar() {
        if (!this._consulta) {
            return;
        }
        let c = this._consulta;
        let pr = c.idPersonaRol || {};
        let persona = pr.idPersona || {};
        this.root.querySelector("#titulo").textContent =
            "Consulta " + (c.referenciaExterna || "sin referencia");
        this.root.querySelector("#subtitulo").textContent =
            (nombreClinica(pr) || "Sin clínica") + " · " + (nombreRol(pr) || "Sin rol");
        this.root.querySelector("#inicio").textContent = "Inicio: " + formatearFecha(c.fechaInicio);

        this.root.querySelector("#datos").replaceChildren(...[
            ["Paciente", nombreCompleto(persona)],
            ["Nacimiento", persona.fechaNacimiento ? formatearSoloFecha(persona.fechaNacimiento) : "—"],
            ["Observaciones", c.observaciones || "—"]
        ].map(([etiqueta, valor]) => {
            let div = document.createElement("div");
            div.className = "dato";
            let span = document.createElement("span");
            span.textContent = etiqueta;
            let strong = document.createElement("strong");
            strong.textContent = valor;
            div.append(span, strong);
            return div;
        }));

        let lista = this.root.querySelector("#listaProcedimientos");
        let procedimientos = this._detalle ? this._detalle.procedimientos : null;
        if (procedimientos === null) {
            let cargando = document.createElement("div");
            cargando.className = "vacio";
            cargando.textContent = "Cargando procedimientos y pasos…";
            lista.replaceChildren(cargando);
            return;
        }
        if (procedimientos.length === 0) {
            let vacio = document.createElement("div");
            vacio.className = "vacio";
            vacio.textContent = "Esta consulta no tiene procedimientos registrados.";
            lista.replaceChildren(vacio);
            return;
        }
        lista.replaceChildren(...procedimientos.map(procedimiento => {
            let caja = document.createElement("div");
            caja.className = "procedimiento";
            let titulo = document.createElement("h5");
            titulo.textContent = procedimiento.nombre || "Procedimiento";
            let meta = document.createElement("p");
            meta.className = "meta";
            meta.textContent = "Inicio: " + formatearFecha(procedimiento.fechaInicio);
            let arbol = document.createElement("arbol-pasos");
            arbol.orden = procedimiento.orden || [];
            arbol.pasos = procedimiento.pasos || [];
            caja.append(titulo, meta, arbol);
            return caja;
        }));
    }
}
customElements.define("tarjeta-consulta", TarjetaConsulta);
export default TarjetaConsulta;
