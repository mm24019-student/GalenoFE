const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/motivo_devolucion.css">
    <div class="fondo" hidden>
        <div class="caja" role="dialog" aria-modal="true" aria-labelledby="titulo">
            <h2 id="titulo">Devolver paso</h2>
            <p id="paso"></p>
            <label for="motivo">Motivo de la devolución</label>
            <textarea id="motivo" placeholder="Explique por qué se devuelve este paso"></textarea>
            <p class="error" id="error" hidden></p>
            <div class="acciones">
                <button id="cancelar" type="button" class="secundario">Cancelar</button>
                <button id="confirmar" type="button" class="primario">Devolver</button>
            </div>
        </div>
    </div>
`;

class MotivoDevolucion extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
        this._paso = null;
        this.q("#cancelar").addEventListener("click", () => this.cerrar());
        this.q("#confirmar").addEventListener("click", () => this.confirmar());
    }

    q(selector) {
        return this.root.querySelector(selector);
    }

    abrir(paso) {
        this._paso = paso || null;
        this.q("#paso").textContent = paso && paso.idProcedimientoPaso
            ? "Paso: " + (paso.idProcedimientoPaso.nombre || "Paso") : "";
        this.q("#motivo").value = "";
        this.q("#error").hidden = true;
        this.q(".fondo").hidden = false;
        this.q("#motivo").focus();
    }

    cerrar() {
        this.q(".fondo").hidden = true;
        this._paso = null;
    }

    confirmar() {
        let motivo = this.q("#motivo").value.trim();
        if (!motivo) {
            this.q("#error").textContent = "Escriba el motivo de la devolución.";
            this.q("#error").hidden = false;
            return;
        }
        let paso = this._paso;
        this.cerrar();
        this.dispatchEvent(new CustomEvent("motivo-confirmado", {
            bubbles: true,
            composed: true,
            detail: { motivo: motivo, paso: paso }
        }));
    }
}
customElements.define("motivo-devolucion", MotivoDevolucion);
export default MotivoDevolucion;
