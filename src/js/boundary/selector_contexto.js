const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/selector_contexto.css">
    <div class="contexto">
        <div>
            <label for="clinica">Clínica</label>
            <select id="clinica"></select>
        </div>
        <div>
            <label for="rol">Rol</label>
            <select id="rol"></select>
        </div>
        <div>
            <button id="trabajar" type="button">Trabajar con este rol</button>
        </div>
    </div>
`;

class SelectorContexto extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
        this._contextos = [];
        this._bloqueado = false;
        this._cargado = false;
    }

    connectedCallback() {
        if (this._cargado) {
            return;
        }
        this._cargado = true;
        this.q("#clinica").addEventListener("change", () => this.pintarRoles());
        this.q("#trabajar").addEventListener("click", () => this.confirmar());
    }

    q(selector) {
        return this.root.querySelector(selector);
    }

    set contextos(valor) {
        this._contextos = valor || [];
        this.pintarContextos();
    }

    get contextos() {
        return this._contextos;
    }

    get clinica() {
        return this.seleccion ? this.seleccion.clinica : null;
    }

    get rol() {
        return this.seleccion ? this.seleccion.rol : null;
    }

    get seleccion() {
        let idClinica = this.q("#clinica").value;
        let idRol = this.q("#rol").value;
        return this._contextos.find(c => c && c.clinica && c.rol
            && c.clinica.idClinica === idClinica && c.rol.idRol === idRol) || null;
    }

    set seleccionActual(contexto) {
        if (!contexto) {
            return;
        }
        if (contexto.clinica) {
            this.q("#clinica").value = contexto.clinica.idClinica;
            this.pintarRoles();
        }
        if (contexto.rol) {
            this.q("#rol").value = contexto.rol.idRol;
        }
    }

    get bloqueado() {
        return this._bloqueado;
    }

    set bloqueado(valor) {
        this._bloqueado = Boolean(valor);
        this.aplicarBloqueo();
    }

    aplicarBloqueo() {
        this.q("#clinica").disabled = this._bloqueado;
        this.q("#rol").disabled = this._bloqueado;
        this.q("#trabajar").disabled = this._bloqueado;
        if (this._bloqueado) {
            this.setAttribute("bloqueado", "");
        } else {
            this.removeAttribute("bloqueado");
        }
    }

    pintarContextos() {
        let clinicas = new Map();
        this._contextos.filter(Boolean).forEach(c => clinicas.set(c.clinica.idClinica, c.clinica));
        this.q("#clinica").replaceChildren(...Array.from(clinicas.values()).map(clinica => {
            let opcion = document.createElement("option");
            opcion.value = clinica.idClinica;
            opcion.textContent = clinica.nombre || "Clínica";
            return opcion;
        }));
        this.pintarRoles();
        this.aplicarBloqueo();
    }

    pintarRoles() {
        let idClinica = this.q("#clinica").value;
        let roles = this._contextos.filter(c => c && c.clinica && c.rol && c.clinica.idClinica === idClinica);
        this.q("#rol").replaceChildren(...roles.map(contexto => {
            let opcion = document.createElement("option");
            opcion.value = contexto.rol.idRol;
            opcion.textContent = contexto.rol.nombre || "Rol";
            return opcion;
        }));
    }

    confirmar() {
        if (this._bloqueado) {
            return;
        }
        let contexto = this.seleccion;
        if (!contexto) {
            this.dispatchEvent(new CustomEvent("error", {
                detail: new Error("Seleccione una clínica y un rol válidos.")
            }));
            return;
        }
        this.dispatchEvent(new CustomEvent("contexto-confirmado", {
            bubbles: true,
            composed: true,
            detail: { contexto: contexto }
        }));
    }
}
customElements.define("selector-contexto", SelectorContexto);
export default SelectorContexto;
