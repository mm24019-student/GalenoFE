import PaginaBase from "./pagina_base.js";
import "./mensaje_panel.js";
import { sesion } from "../control/sesion.js";
import ConsultaService from "../control/consulta_service.js";
import ConsultaProcedimientoService from "../control/consulta_procedimiento_service.js";
import ConsultaProcedimientoPasoService from "../control/consulta_procedimiento_paso_service.js";
import ProcedimientoService from "../control/procedimiento_service.js";
import ProcedimientoPasoService from "../control/procedimiento_paso_service.js";
import ProcedimientoPasoSecuenciaService from "../control/procedimiento_paso_secuencia_service.js";
import ProcedimientoPasoExamenService from "../control/procedimiento_paso_examen_service.js";
import OrdenExamenService from "../control/orden_examen_service.js";
import ExamenResultadoService from "../control/examen_resultado_service.js";
import { formatearFecha, formatearSoloFecha, ahoraISO } from "../model/fechas.js";
import { nombreClinica, nombreCompleto, nombreRol } from "../model/citas.js";
import { ordenarPasos, pasosOrdenados, indicePasoActual, idDePasoConsulta } from "../model/secuencia.js";
import { asignacionPara, nuevoPaso, textoIndicaciones } from "../model/atencion.js";
import { nuevoId } from "../model/ids.js";

/**
 * Atención de una consulta. Permite registrar el seguimiento de un paso,
 * asignar exámenes de la lista permitida y avanzar o retroceder en la
 * secuencia del procedimiento.
 */
class PaginaAtencion extends PaginaBase {

    get titulo() {
        return "Atención de consulta";
    }

    constructor() {
        super();
        this.consulta = null;
        this.procedimientos = [];
        this.procedimientoActual = null;
        this.indiceActual = 0;
        this.examenes = [];
        this.seleccionExamenes = new Set();
        this.idConsulta = null;
    }

    contenido() {
        let contenedor = document.createElement("div");
        contenedor.innerHTML = `
            <link rel="stylesheet" href="recursos/estilos/paginas/pagina_atencion.css">
            <a class="volver" href="#/dashboard">← Volver al dashboard</a>
            <mensaje-panel id="mensaje" oculto></mensaje-panel>
            <div id="contenido" hidden>
                <section class="resumen" id="resumen"></section>
                <section class="panel">
                    <h2>Procedimientos de la consulta</h2>
                    <div class="fila-doble">
                        <div>
                            <label for="procedimiento">Procedimiento</label>
                            <select id="procedimiento"></select>
                        </div>
                        <div>
                            <label for="nuevoProcedimiento">Agregar otro procedimiento</label>
                            <select id="nuevoProcedimiento"><option value="">Seleccione…</option></select>
                        </div>
                    </div>
                    <div class="acciones">
                        <button id="agregar" type="button" class="secundario">Agregar procedimiento</button>
                    </div>
                </section>
                <section class="panel">
                    <h2>Pasos del procedimiento</h2>
                    <ol class="pasos" id="pasos"></ol>
                </section>
                <section class="panel" id="atencion">
                    <h2 id="tituloPaso">Atención del paso</h2>
                    <p class="meta" id="metaPaso"></p>
                    <label for="valor">Registro de la atención</label>
                    <textarea id="valor" rows="5" placeholder="Documente lo realizado en este paso"></textarea>
                    <div class="fila-doble">
                        <div>
                            <label for="estado">Estado del paso</label>
                            <select id="estado">
                                <option value="PENDIENTE">Pendiente</option>
                                <option value="EN_PROCESO">En proceso</option>
                                <option value="COMPLETADO">Completado</option>
                                <option value="CANCELADO">Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <fieldset class="panel" id="panelExamenes" >
                        <legend>Exámenes que pueden asignarse</legend>
                        <div class="examenes" id="examenes"></div>
                        <p class="nota" id="notaExamenes"></p>
                    </fieldset>
                    <div class="acciones">
                        <button id="guardar" type="button" class="primario">Guardar atención</button>
                        <button id="retroceder" type="button" class="secundario">← Paso anterior</button>
                        <button id="avanzar" type="button" class="primario">Completar y avanzar →</button>
                    </div>
                </section>
            </div>
        `;
        return contenedor;
    }

    conectado() {
        this.mensaje = this.q("#mensaje");
        this.contenido = this.q("#contenido");
        this.idConsulta = this.parametros.get("id");
        if (!sesion.activa) {
            this.mensaje.mostrar("error", "Debe iniciar sesión para atender una consulta.");
            return;
        }
        if (!this.idConsulta) {
            this.mensaje.mostrar("error", "Seleccione una consulta desde el dashboard.");
            return;
        }
        this.q("#procedimiento").addEventListener("change", evento => {
            this.seleccionarProcedimiento(evento.target.value);
        });
        this.q("#agregar").addEventListener("click", () => this.agregarProcedimiento());
        this.q("#guardar").addEventListener("click", () => this.guardar(false));
        this.q("#avanzar").addEventListener("click", () => this.guardar(true));
        this.q("#retroceder").addEventListener("click", () => this.retroceder());
        this.cargar();
    }

    cargar() {
        this.mensaje.mostrar("cargando", "Cargando la consulta…");
        new ConsultaService().findById(this.idConsulta).then(resp => {
            this.consulta = resp.datos;
            this.pintarResumen();
            this.contenido.hidden = false;
            return this.cargarProcedimientos();
        }).catch(error => {
            this.mensaje.mostrar("error", error.message || "No se pudo cargar la consulta.");
        });
    }

    pintarResumen() {
        let c = this.consulta || {};
        let pr = c.idPersonaRol || {};
        let persona = pr.idPersona || {};
        let datos = [
            ["Paciente", nombreCompleto(persona)],
            ["Nacimiento", persona.fechaNacimiento ? formatearSoloFecha(persona.fechaNacimiento) : "—"],
            ["Clínica", nombreClinica(pr) || "—"],
            ["Rol del paciente", nombreRol(pr) || "—"],
            ["Inicio", formatearFecha(c.fechaInicio)],
            ["Referencia", c.referenciaExterna || "—"]
        ];
        this.q("#resumen").replaceChildren(...datos.map(([etiqueta, valor]) => {
            let div = document.createElement("div");
            div.className = "dato";
            let span = document.createElement("span");
            span.textContent = etiqueta;
            let strong = document.createElement("strong");
            strong.textContent = valor;
            div.append(span, strong);
            return div;
        }));
    }

    cargarProcedimientos(mantenerSeleccion = true) {
        let idActual = mantenerSeleccion && this.procedimientoActual
            ? this.procedimientoActual.id : null;
        let cpService = new ConsultaProcedimientoService();
        let pasoService = new ConsultaProcedimientoPasoService();
        let definicionService = new ProcedimientoPasoService();
        let secuenciaService = new ProcedimientoPasoSecuenciaService();
        return this.cargarCatalogoProcedimientos().then(() => cpService.porConsulta(this.idConsulta)).then(resp => {
            let lista = resp.datos || [];
            return Promise.all(lista.map(cp => {
                return Promise.all([
                    definicionService.porProcedimiento(cp.idProcedimiento).then(r => r.datos || []).catch(() => []),
                    secuenciaService.porProcedimiento(cp.idProcedimiento).then(r => r.datos || []).catch(() => []),
                    pasoService.porConsultaProcedimiento(cp.idConsultaProcedimiento).then(r => r.datos || []).catch(() => []),
                    this.nombreProcedimiento(cp.idProcedimiento)
                ]).then(([definiciones, secuencias, pasos, nombre]) => ({
                    id: cp.idConsultaProcedimiento,
                    idProcedimiento: cp.idProcedimiento,
                    nombre: nombre,
                    fechaInicio: cp.fechaInicio,
                    definiciones: definiciones,
                    orden: ordenarPasos(definiciones, secuencias),
                    pasos: pasos
                }));
            }));
        }).then(procedimientos => {
            this.procedimientos = procedimientos;
            this.mensaje.ocultar();
            if (procedimientos.length === 0) {
                this.procedimientoActual = null;
                this.q("#procedimiento").replaceChildren();
                this.q("#pasos").replaceChildren();
                this.q("#atencion").classList.add("oculto");
                this.mensaje.mostrar("info",
                    "Esta consulta no tiene procedimientos. Agregue uno para comenzar la atención.");
                return;
            }
            let elegido = procedimientos.find(p => p.id === idActual) || procedimientos[0];
            this.seleccionarProcedimiento(elegido.id);
        }).catch(error => {
            this.mensaje.mostrar("error", error.message || "No se pudieron cargar los procedimientos.");
        });
    }

    nombreProcedimiento(id) {
        if (!this.catalogoProcedimientos) {
            return Promise.resolve("Procedimiento");
        }
        return Promise.resolve(this.catalogoProcedimientos.get(id) || "Procedimiento");
    }

    cargarCatalogoProcedimientos() {
        if (this.catalogoProcedimientos) {
            return Promise.resolve(this.catalogoProcedimientos);
        }
        return new ProcedimientoService().findRange(0, 200).then(resp => {
            this.catalogoProcedimientos = new Map();
            (resp.datos || []).forEach(p => this.catalogoProcedimientos.set(p.idProcedimiento, p.nombre));
            this.rellenarSelectNuevoProcedimiento();
            return this.catalogoProcedimientos;
        }).catch(() => {
            this.catalogoProcedimientos = new Map();
            return this.catalogoProcedimientos;
        });
    }

    rellenarSelectNuevoProcedimiento() {
        let select = this.q("#nuevoProcedimiento");
        let actual = select.value;
        select.replaceChildren();
        let vacia = document.createElement("option");
        vacia.value = "";
        vacia.textContent = "Seleccione…";
        select.appendChild(vacia);
        (this.catalogoProcedimientos || new Map()).forEach((nombre, id) => {
            let opcion = document.createElement("option");
            opcion.value = id;
            opcion.textContent = nombre;
            select.appendChild(opcion);
        });
        select.value = actual || "";
    }

    seleccionarProcedimiento(id) {
        let procedimiento = this.procedimientos.find(p => p.id === id) || this.procedimientos[0];
        if (!procedimiento) {
            return;
        }
        this.procedimientoActual = procedimiento;
        this.indiceActual = indicePasoActual(procedimiento.pasos, procedimiento.orden);
        let select = this.q("#procedimiento");
        select.replaceChildren(...this.procedimientos.map(p => {
            let opcion = document.createElement("option");
            opcion.value = p.id;
            opcion.textContent = p.nombre;
            return opcion;
        }));
        select.value = procedimiento.id;
        this.pintarPasos();
        this.pintarAtencion();
    }

    pasosActuales() {
        if (!this.procedimientoActual) {
            return [];
        }
        return pasosOrdenados(this.procedimientoActual.pasos, this.procedimientoActual.orden);
    }

    pintarPasos() {
        let lista = this.q("#pasos");
        let pasos = this.pasosActuales();
        if (pasos.length === 0) {
            let vacio = document.createElement("li");
            vacio.className = "meta";
            vacio.textContent = "El procedimiento no tiene pasos registrados.";
            lista.replaceChildren(vacio);
            return;
        }
        if (this.indiceActual >= pasos.length) {
            this.indiceActual = pasos.length - 1;
        }
        lista.replaceChildren(...pasos.map((paso, indice) => {
            let li = document.createElement("li");
            let boton = document.createElement("button");
            boton.type = "button";
            if (indice === this.indiceActual) {
                boton.setAttribute("aria-current", "step");
            }
            let numero = document.createElement("span");
            numero.textContent = String(indice + 1);
            let nombre = document.createElement("span");
            nombre.className = "nombre";
            let definicion = paso.idProcedimientoPaso || {};
            nombre.textContent = definicion.nombre || "Paso";
            let estado = document.createElement("span");
            let valorEstado = String(paso.estado || "PENDIENTE").toUpperCase();
            estado.className = "estado " + valorEstado;
            estado.textContent = valorEstado.replace("_", " ");
            boton.append(numero, nombre, estado);
            boton.addEventListener("click", () => {
                this.indiceActual = indice;
                this.pintarPasos();
                this.pintarAtencion();
            });
            li.appendChild(boton);
            return li;
        }));
    }

    pasoActual() {
        return this.pasosActuales()[this.indiceActual] || null;
    }

    pintarAtencion() {
        let paso = this.pasoActual();
        if (!paso) {
            this.q("#atencion").classList.add("oculto");
            return;
        }
        this.q("#atencion").classList.remove("oculto");
        let definicion = paso.idProcedimientoPaso || {};
        this.q("#tituloPaso").textContent = "Atención del paso: " + (definicion.nombre || "Paso");
        let persona = paso.idPersonaRol && paso.idPersonaRol.idPersona
            ? nombreCompleto(paso.idPersonaRol.idPersona) : "Sin responsable";
        let rol = paso.idPersonaRol && paso.idPersonaRol.idRol
            ? paso.idPersonaRol.idRol.nombre : "";
        this.q("#metaPaso").textContent =
            "Responsable: " + persona + (rol ? " (" + rol + ")" : "") + " · " + formatearFecha(paso.fechaInicio);
        this.q("#valor").value = paso.valor || "";
        this.q("#estado").value = String(paso.estado || "PENDIENTE").toUpperCase();
        this.q("#valor").focus();
        this.cargarExamenes(definicion.idProcedimientoPaso);
    }

    cargarExamenes(idDefinicion) {
        let contenedor = this.q("#examenes");
        let nota = this.q("#notaExamenes");
        this.examenes = [];
        this.seleccionExamenes.clear();
        contenedor.replaceChildren();
        nota.textContent = "Cargando exámenes disponibles…";
        if (!idDefinicion) {
            nota.textContent = "El paso no tiene definición de exámenes.";
            return;
        }
        new ProcedimientoPasoExamenService().porProcedimientoPaso(idDefinicion).then(resp => {
            this.examenes = (resp.datos || [])
                .filter(link => link.activo !== false && link.idExamen)
                .map(link => ({
                    idExamen: link.idExamen.idExamen,
                    nombre: link.idExamen.nombre || "Examen",
                    observaciones: link.observaciones || ""
                }));
            if (this.examenes.length === 0) {
                nota.textContent = "Este paso no tiene exámenes configurados.";
                return;
            }
            nota.textContent = "Marque los exámenes que se administraron en esta atención.";
            contenedor.replaceChildren(...this.examenes.map(examen => {
                let etiqueta = document.createElement("label");
                etiqueta.className = "examen";
                let check = document.createElement("input");
                check.type = "checkbox";
                check.value = examen.idExamen;
                check.addEventListener("change", () => {
                    if (check.checked) {
                        this.seleccionExamenes.add(examen.idExamen);
                    } else {
                        this.seleccionExamenes.delete(examen.idExamen);
                    }
                });
                let texto = document.createElement("span");
                texto.textContent = examen.nombre;
                etiqueta.append(check, texto);
                return etiqueta;
            }));
        }).catch(() => {
            nota.textContent = "No se pudieron cargar los exámenes de este paso.";
        });
    }

    guardar(avanzar) {
        let paso = this.pasoActual();
        if (!paso) {
            return;
        }
        let valor = this.q("#valor").value.trim();
        let estado = this.q("#estado").value;
        if (avanzar) {
            estado = "COMPLETADO";
        }
        if (!valor) {
            this.mensaje.mostrar("error", "Documente la atención antes de guardar.");
            this.q("#valor").focus();
            return;
        }
        let actualizado = Object.assign({}, paso, { valor: valor, estado: estado });
        if (estado === "COMPLETADO") {
            actualizado.fechaFin = paso.fechaFin || ahoraISO();
        }
        this.mensaje.mostrar("cargando", "Guardando la atención…");
        new ConsultaProcedimientoPasoService().update(paso.idConsultaProcedimientoPaso, actualizado)
            .then(() => this.registrarExamenes(paso))
            .then(() => this.recargarPasos(paso.idConsultaProcedimientoPaso))
            .then(() => {
                this.mensaje.mostrar("exito", "Atención guardada correctamente.");
                if (avanzar) {
                    this.avanzar();
                }
            })
            .catch(error => {
                this.mensaje.mostrar("error", error.message || "No se pudo guardar la atención.");
            });
    }

    registrarExamenes(paso) {
        let seleccionados = this.examenes.filter(e => this.seleccionExamenes.has(e.idExamen));
        if (seleccionados.length === 0) {
            return Promise.resolve();
        }
        let idOrden = nuevoId();
        let orden = {
            idOrdenExamen: idOrden,
            fechaCreacion: ahoraISO(),
            indicaciones: textoIndicaciones(seleccionados.map(e => e.nombre)),
            idConsultaProcedimientoPaso: {
                idConsultaProcedimientoPaso: paso.idConsultaProcedimientoPaso
            }
        };
        let ordenService = new OrdenExamenService();
        let resultadoService = new ExamenResultadoService();
        return ordenService.create(orden).then(() => {
            return Promise.all(seleccionados.map(examen => resultadoService.create({
                idExamenResultado: nuevoId(),
                fechaCreacion: ahoraISO(),
                resultado: examen.nombre,
                interpretacion: "Examen administrado durante la atención",
                rutaAtestado: "pendiente",
                idOrdenExamen: { idOrdenExamen: idOrden }
            })));
        }).then(() => {
            this.seleccionExamenes.clear();
        });
    }

    recargarPasos(idPasoSeleccionado) {
        let idProcedimiento = this.procedimientoActual ? this.procedimientoActual.id : null;
        return this.cargarProcedimientos(true).then(() => {
            let procedimiento = this.procedimientos.find(p => p.id === idProcedimiento);
            if (!procedimiento) {
                return;
            }
            this.procedimientoActual = procedimiento;
            let pasos = pasosOrdenados(procedimiento.pasos, procedimiento.orden);
            let indice = pasos.findIndex(p => p.idConsultaProcedimientoPaso === idPasoSeleccionado);
            this.indiceActual = indice >= 0 ? indice : indicePasoActual(procedimiento.pasos, procedimiento.orden);
            this.pintarPasos();
            this.pintarAtencion();
        });
    }

    avanzar() {
        let procedimiento = this.procedimientoActual;
        let actual = this.pasoActual();
        if (!procedimiento || !actual) {
            return;
        }
        let definiciones = procedimiento.orden || [];
        let idActual = idDePasoConsulta(actual);
        let posicion = definiciones.findIndex(d => d.idProcedimientoPaso === idActual);
        if (posicion < 0 || posicion >= definiciones.length - 1) {
            this.mensaje.mostrar("info", "Este ya es el último paso del procedimiento.");
            return;
        }
        let siguiente = definiciones[posicion + 1];
        let existente = pasosOrdenados(procedimiento.pasos, definiciones)
            .find(p => idDePasoConsulta(p) === siguiente.idProcedimientoPaso);
        if (existente) {
            let pasos = pasosOrdenados(procedimiento.pasos, definiciones);
            this.indiceActual = pasos.indexOf(existente);
            this.pintarPasos();
            this.pintarAtencion();
            return;
        }
        let asignacion = asignacionPara(siguiente, sesion.asignaciones, sesion.clinica);
        let idRolSiguiente = siguiente.idRol ? siguiente.idRol.idRol : null;
        let asignacionCorrecta = asignacion && asignacion.rol
            && asignacion.rol.idRol === idRolSiguiente ? asignacion : null;
        let nuevo = nuevoPaso({
            idConsultaProcedimiento: procedimiento.id,
            definicion: siguiente,
            asignacion: asignacionCorrecta
        });
        this.mensaje.mostrar("cargando", "Creando el siguiente paso…");
        new ConsultaProcedimientoPasoService().create(nuevo).then(() => {
            this.mensaje.mostrar("exito", "Siguiente paso creado. Puede continuar la atención.");
            return this.cargarProcedimientos(true);
        }).then(() => {
            let p = this.procedimientos.find(x => x.id === procedimiento.id);
            if (!p) {
                return;
            }
            this.procedimientoActual = p;
            let pasos = pasosOrdenados(p.pasos, p.orden);
            let indice = pasos.findIndex(x => idDePasoConsulta(x) === siguiente.idProcedimientoPaso);
            this.indiceActual = indice >= 0 ? indice : pasos.length - 1;
            this.pintarPasos();
            this.pintarAtencion();
        }).catch(error => {
            this.mensaje.mostrar("error", error.message || "No se pudo crear el siguiente paso.");
        });
    }

    retroceder() {
        let procedimiento = this.procedimientoActual;
        let actual = this.pasoActual();
        if (!procedimiento || !actual) {
            return;
        }
        let definiciones = procedimiento.orden || [];
        let posicion = definiciones.findIndex(d => d.idProcedimientoPaso === idDePasoConsulta(actual));
        if (posicion <= 0) {
            this.mensaje.mostrar("info", "Este ya es el primer paso del procedimiento.");
            return;
        }
        let anterior = definiciones[posicion - 1];
        let pasos = pasosOrdenados(procedimiento.pasos, definiciones);
        let indice = pasos.findIndex(p => idDePasoConsulta(p) === anterior.idProcedimientoPaso);
        if (indice < 0) {
            this.mensaje.mostrar("info", "El paso anterior todavía no ha sido creado.");
            return;
        }
        this.indiceActual = indice;
        this.pintarPasos();
        this.pintarAtencion();
    }

    agregarProcedimiento() {
        let idProcedimiento = this.q("#nuevoProcedimiento").value;
        if (!idProcedimiento) {
            this.mensaje.mostrar("error", "Seleccione un procedimiento para agregar.");
            return;
        }
        this.mensaje.mostrar("cargando", "Agregando el procedimiento…");
        new ConsultaProcedimientoService().create({
            idConsultaProcedimiento: nuevoId(),
            idProcedimiento: idProcedimiento,
            fechaInicio: ahoraISO(),
            observaciones: "Procedimiento agregado durante la atención",
            idConsulta: { idConsulta: this.idConsulta }
        }).then(() => {
            this.mensaje.mostrar("exito", "Procedimiento agregado. Se generaron sus pasos iniciales.");
            return this.cargarProcedimientos(false);
        }).catch(error => {
            this.mensaje.mostrar("error", error.message || "No se pudo agregar el procedimiento.");
        });
    }
}
customElements.define("pagina-atencion", PaginaAtencion);
export default PaginaAtencion;
