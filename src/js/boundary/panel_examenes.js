import ProcedimientoPasoExamenService from "../control/procedimiento_paso_examen_service.js";
import OrdenExamenService from "../control/orden_examen_service.js";
import ExamenResultadoService from "../control/examen_resultado_service.js";
import { indicacionesExamen, examenDeIndicaciones, textoResultado } from "../model/examenes.js";
import { nuevoId } from "../model/ids.js";
import { ahoraISO } from "../model/fechas.js";

const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/panel_examenes.css">
    <div class="panel-examenes">
        <p class="nota" id="nota"></p>
        <div id="formulario"></div>
        <section id="historialSection" hidden>
            <h3>Resultados registrados</h3>
            <div class="historial" id="historial"></div>
        </section>
    </div>
`;

class PanelExamenes extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
        this._definicion = null;
        this._paso = null;
        this._pasos = [];
        this._editable = false;
        this._catalogo = [];
        this._historial = [];
        this._cargado = false;
        this._pendiente = false;
    }

    connectedCallback() {
        if (this._cargado) {
            return;
        }
        this._cargado = true;
        this.programarCarga();
    }

    q(selector) {
        return this.root.querySelector(selector);
    }

    set definicion(valor) {
        this._definicion = valor || null;
        this.programarCarga();
    }

    set paso(valor) {
        this._paso = valor || null;
        this.programarCarga();
    }

    set pasos(valor) {
        this._pasos = valor || [];
        this.programarCarga();
    }

    set editable(valor) {
        this._editable = Boolean(valor);
        this.pintar();
    }

    programarCarga() {
        if (this._pendiente) {
            return;
        }
        this._pendiente = true;
        Promise.resolve().then(() => {
            this._pendiente = false;
            this.cargar();
        });
    }

    cargar() {
        this.q("#nota").textContent = "Cargando exámenes y resultados…";
        let catalogo = this.cargarCatalogo();
        let historial = this.cargarHistorial();
        return Promise.all([catalogo, historial]).then(([lista, resultados]) => {
            this._catalogo = lista;
            this._historial = resultados;
            this.pintar();
        }).catch(() => {
            this.q("#nota").textContent = "No se pudieron cargar los exámenes.";
            this.pintar();
        });
    }

    cargarCatalogo() {
        if (!this._definicion) {
            return Promise.resolve([]);
        }
        return new ProcedimientoPasoExamenService().porProcedimientoPaso(this._definicion).then(resp => {
            return (resp.datos || []).filter(link => link && link.activo !== false && link.idExamen).map(link => ({
                idExamen: link.idExamen.idExamen,
                nombre: link.idExamen.nombre || "Examen",
                observaciones: link.observaciones || ""
            }));
        }).catch(() => []);
    }

    cargarHistorial() {
        let pasos = (this._pasos || []).filter(p => p && p.idConsultaProcedimientoPaso);
        return Promise.all(pasos.map(paso => this.cargarHistorialPaso(paso))).then(grupos => {
            return grupos.reduce((todo, grupo) => todo.concat(grupo), []);
        }).catch(() => []);
    }

    cargarHistorialPaso(paso) {
        return new OrdenExamenService().porConsultaProcedimientoPaso(paso.idConsultaProcedimientoPaso).then(resp => {
            let ordenes = (resp.datos || []).filter(Boolean);
            return Promise.all(ordenes.map(orden => {
                return new ExamenResultadoService().porOrdenExamen(orden.idOrdenExamen).then(r => {
                    return (r.datos || []).map(resultado => ({
                        idPaso: paso.idConsultaProcedimientoPaso,
                        idOrdenExamen: orden.idOrdenExamen,
                        idExamenResultado: resultado.idExamenResultado,
                        fechaCreacion: resultado.fechaCreacion,
                        examen: examenDeIndicaciones(orden.indicaciones),
                        resultado: resultado.resultado || "",
                        interpretacion: resultado.interpretacion || "",
                        rutaAtestado: resultado.rutaAtestado || ""
                    }));
                }).catch(() => []);
            }));
        }).then(grupos => {
            return grupos.reduce((todo, grupo) => todo.concat(grupo), []);
        }).catch(() => []);
    }

    pintar() {
        this.pintarFormulario();
        this.pintarHistorial();
    }

    pintarFormulario() {
        let contenedor = this.q("#formulario");
        let nota = this.q("#nota");
        contenedor.replaceChildren();
        if (!this._editable) {
            nota.textContent = "Los resultados registrados se muestran solo para consulta.";
            return;
        }
        if (this._catalogo.length === 0) {
            nota.textContent = "Este paso no tiene exámenes configurados.";
            return;
        }
        nota.textContent = "Marque los exámenes administrados y escriba el resultado.";
        contenedor.replaceChildren(...this._catalogo.map(examen => this.filaExamen(examen)));
    }

    filaExamen(examen) {
        let existente = this._historial.find(item => item.idPaso === (this._paso && this._paso.idConsultaProcedimientoPaso)
            && item.examen.idExamen === examen.idExamen);
        let fila = document.createElement("div");
        fila.className = "fila-examen";
        fila.dataset.idExamen = examen.idExamen;

        let etiqueta = document.createElement("label");
        let check = document.createElement("input");
        check.type = "checkbox";
        check.checked = Boolean(existente);
        etiqueta.append(check, document.createTextNode(" " + examen.nombre));

        let resultado = document.createElement("input");
        resultado.type = "text";
        resultado.className = "resultado";
        resultado.placeholder = "Resultado";
        resultado.value = existente ? existente.resultado : "";

        let interpretacion = document.createElement("input");
        interpretacion.type = "text";
        interpretacion.className = "interpretacion";
        interpretacion.placeholder = "Interpretación";
        interpretacion.value = existente ? existente.interpretacion : "";

        fila.append(etiqueta, resultado, interpretacion);
        return fila;
    }

    pintarHistorial() {
        let seccion = this.q("#historialSection");
        let lista = this.q("#historial");
        lista.replaceChildren();
        if (this._historial.length === 0) {
            seccion.hidden = true;
            return;
        }
        seccion.hidden = false;
        lista.replaceChildren(...this._historial.map(item => {
            let caja = document.createElement("div");
            caja.className = "resultado";
            let nombre = document.createElement("strong");
            nombre.textContent = item.examen.nombre || "Examen";
            let resultado = document.createElement("span");
            resultado.textContent = "Resultado: " + item.resultado;
            let interpretacion = document.createElement("span");
            interpretacion.textContent = "Interpretación: " + item.interpretacion;
            caja.append(nombre, resultado, interpretacion);
            return caja;
        }));
    }

    seleccionados() {
        return Array.from(this.q("#formulario").querySelectorAll(".fila-examen")).filter(fila => {
            return fila.querySelector("input[type=checkbox]").checked;
        }).map(fila => ({
            idExamen: fila.dataset.idExamen,
            nombre: fila.querySelector("label").textContent.trim(),
            resultado: fila.querySelector(".resultado").value,
            interpretacion: fila.querySelector(".interpretacion").value
        }));
    }

    guardar(paso) {
        if (!paso || !this._editable) {
            return Promise.resolve();
        }
        let tareas = this.seleccionados().map(item => this.guardarUno(paso, item));
        if (tareas.length === 0) {
            return Promise.resolve();
        }
        return Promise.all(tareas).then(() => {
            this.dispatchEvent(new CustomEvent("examenes-guardados", { bubbles: true, composed: true }));
            return this.cargar();
        });
    }

    guardarUno(paso, item) {
        let existente = this._historial.find(entry => entry.idPaso === paso.idConsultaProcedimientoPaso
            && entry.examen.idExamen === item.idExamen);
        let resultado = textoResultado(item.resultado);
        let interpretacion = textoResultado(item.interpretacion);
        let ruta = textoResultado(item.rutaAtestado || (existente && existente.rutaAtestado), "pendiente");
        if (existente) {
            return new ExamenResultadoService().update(existente.idExamenResultado, {
                idExamenResultado: existente.idExamenResultado,
                fechaCreacion: existente.fechaCreacion,
                resultado: resultado,
                interpretacion: interpretacion,
                rutaAtestado: ruta,
                idOrdenExamen: { idOrdenExamen: existente.idOrdenExamen }
            });
        }
        let idOrden = nuevoId();
        return new OrdenExamenService().create({
            idOrdenExamen: idOrden,
            fechaCreacion: ahoraISO(),
            indicaciones: indicacionesExamen(item),
            idConsultaProcedimientoPaso: { idConsultaProcedimientoPaso: paso.idConsultaProcedimientoPaso }
        }).then(() => new ExamenResultadoService().create({
            idExamenResultado: nuevoId(),
            fechaCreacion: ahoraISO(),
            resultado: resultado,
            interpretacion: interpretacion,
            rutaAtestado: ruta,
            idOrdenExamen: { idOrdenExamen: idOrden }
        }));
    }
}
customElements.define("panel-examenes", PanelExamenes);
export default PanelExamenes;
