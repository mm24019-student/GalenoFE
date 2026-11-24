import TipoDocumentoService from "../control/tipo_documento_service.js";
import { conectividad } from "../control/conectividad.js";

const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/selector_documento.css">
    <fieldset>
        <legend>Identificación</legend>
        <div class="fila">
            <div>
                <label for="tipo">Tipo de documento</label>
                <select id="tipo" required>
                    <option value="">Seleccione…</option>
                </select>
            </div>
            <div>
                <label for="valor">Número de documento</label>
                <input id="valor" type="text" autocomplete="off" required placeholder="Escriba el número">
            </div>
            <button id="buscar" type="button">Buscar</button>
        </div>
    </fieldset>
`;

/**
 * <selector-documento>
 * Formulario reutilizable de tipo + numero de documento. Al pulsar "Buscar"
 * emite "documento-buscado" con { tipo, valor }, y "error" si los campos
 * estan incompletos. La pantalla que lo usa decide que hacer con esos datos.
 */
class SelectorDocumento extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
        this.cargado = false;
        this.estado = "inicial";
        this._bloqueado = false;
        this.alCambiarConectividad = evento => this.aplicarConexion(evento.detail.conectado);
    }

    connectedCallback() {
        if (this.cargado) {
            return;
        }
        this.cargado = true;
        this.q("#buscar").addEventListener("click", () => this.buscar());
        this.q("#valor").addEventListener("keydown", evento => {
            if (evento.key === "Enter") {
                evento.preventDefault();
                this.buscar();
            }
        });
        conectividad.addEventListener("cambio", this.alCambiarConectividad);
        this.aplicarConexion(conectividad.conectado);
        this.cargarTipos();
    }

    disconnectedCallback() {
        conectividad.removeEventListener("cambio", this.alCambiarConectividad);
    }

    aplicarConexion(conectado) {
        this.aplicarBloqueo();
        this.q("#buscar").disabled = !conectado || this._bloqueado || this.ocupadoAhora === true;
    }

    q(selector) {
        return this.root.querySelector(selector);
    }

    cargarTipos() {
        if (!conectividad.conectado) {
            return;
        }
        new TipoDocumentoService().findRange(0, 100).then(resp => {
            let select = this.q("#tipo");
            (resp.datos || []).filter(t => t.activo !== false).forEach(tipo => {
                let opcion = document.createElement("option");
                opcion.value = tipo.idTipoDocumento;
                opcion.textContent = tipo.nombre || "Documento";
                select.appendChild(opcion);
            });
        }).catch(error => {
            this.dispatchEvent(new CustomEvent("error", { detail: error }));
        });
    }

    get tipo() {
        return this.q("#tipo").value;
    }

    get valor() {
        return this.q("#valor").value;
    }

    get bloqueado() {
        return this._bloqueado;
    }

    set bloqueado(valor) {
        this._bloqueado = Boolean(valor);
        this.aplicarBloqueo();
    }

    aplicarBloqueo() {
        this.q("#tipo").disabled = this._bloqueado;
        this.q("#valor").disabled = this._bloqueado;
        this.q("#buscar").disabled = this._bloqueado;
    }

    buscar() {
        if (this._bloqueado || !conectividad.conectado) {
            return;
        }
        if (!this.tipo) {
            this.dispatchEvent(new CustomEvent("error", {
                detail: new Error("Seleccione el tipo de documento.")
            }));
            this.q("#tipo").focus();
            return;
        }
        if (!this.valor.trim()) {
            this.dispatchEvent(new CustomEvent("error", {
                detail: new Error("Escriba el número de documento.")
            }));
            this.q("#valor").focus();
            return;
        }
        this.ocupado(true);
        this.dispatchEvent(new CustomEvent("documento-buscado", {
            detail: { tipo: this.tipo, valor: this.valor.trim() }
        }));
    }

    ocupado(valor) {
        let boton = this.q("#buscar");
        this.ocupadoAhora = Boolean(valor);
        boton.disabled = this.ocupadoAhora || this._bloqueado || !conectividad.conectado;
        boton.textContent = valor ? "Buscando…" : "Buscar";
    }

    listo() {
        this.ocupado(false);
    }
}
customElements.define("selector-documento", SelectorDocumento);
export default SelectorDocumento;
