import { formatearFecha } from "../model/fechas.js";
import { pasosOrdenados } from "../model/secuencia.js";

const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/arbol_pasos.css">
    <ol id="lista"></ol>
`;

/**
 * <arbol-pasos>
 * Muestra de forma jerárquica los pasos de un procedimiento, con su estado,
 * responsable, fecha y el registro capturado en cada uno.
 */
class ArbolPasos extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
        this._pasos = [];
        this._orden = [];
    }

    set pasos(valor) {
        this._pasos = valor || [];
        this.pintar();
    }

    set orden(valor) {
        this._orden = valor || [];
        this.pintar();
    }

    pintar() {
        let lista = this.root.querySelector("#lista");
        if (this._pasos.length === 0) {
            let vacio = document.createElement("li");
            vacio.className = "vacio";
            vacio.textContent = "Todavía no hay pasos registrados.";
            lista.replaceChildren(vacio);
            return;
        }
        let pasos = pasosOrdenados(this._pasos, this._orden).filter(Boolean);
        lista.replaceChildren(...pasos.map((paso, indice) => this.item(paso, indice)));
    }

    item(paso, indice) {
        let li = document.createElement("li");
        let caja = document.createElement("div");
        caja.className = "paso";

        let linea = document.createElement("div");
        linea.className = "linea";
        let nombre = document.createElement("span");
        nombre.className = "nombre";
        let definicion = paso.idProcedimientoPaso || {};
        nombre.textContent = (indice + 1) + ". " + (definicion.nombre || "Paso");
        let estado = document.createElement("span");
        let valorEstado = String(paso.estado || "PENDIENTE").toUpperCase();
        estado.className = "estado " + valorEstado;
        estado.textContent = valorEstado.replace("_", " ");
        linea.append(nombre, estado);

        let meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = formatearFecha(paso.fechaInicio);

        let detalles = document.createElement("details");
        let resumen = document.createElement("summary");
        resumen.textContent = "Ver registro del paso";
        let registro = document.createElement("p");
        registro.className = "registro";
        registro.textContent = String(paso.valor || "").trim() ? String(paso.valor) : "Sin registro capturado.";
        detalles.append(resumen, registro);

        caja.append(linea, meta, detalles);
        li.appendChild(caja);
        return li;
    }
}
customElements.define("arbol-pasos", ArbolPasos);
export default ArbolPasos;
