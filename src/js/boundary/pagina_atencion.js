import PaginaBase from "./pagina_base.js";
import "./mensaje_panel.js";
import "./panel_examenes.js";
import "./motivo_devolucion.js";
import { sesion } from "../control/sesion.js";
import ConsultaService from "../control/consulta_service.js";
import ConsultaProcedimientoService from "../control/consulta_procedimiento_service.js";
import ConsultaProcedimientoPasoService from "../control/consulta_procedimiento_paso_service.js";
import ProcedimientoService from "../control/procedimiento_service.js";
import ProcedimientoPasoService from "../control/procedimiento_paso_service.js";
import ProcedimientoPasoSecuenciaService from "../control/procedimiento_paso_secuencia_service.js";
import { formatearFecha, formatearSoloFecha, ahoraISO } from "../model/fechas.js";
import { nombreClinica, nombreCompleto, nombreRol } from "../model/citas.js";
import { ordenarPasos, pasosOrdenados, idDePasoConsulta } from "../model/secuencia.js";
import { esCompletado, idRolDePaso } from "../model/atencion.js";
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
        this.panelExamenes = null;
        this.motivo = null;
        this.idConsulta = null;
        this.idProcedimientoFijado = null;
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
                            <span id="fijado" class="fijado" hidden>Procedimiento fijado para esta atención</span>
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
                    <panel-examenes id="panelExamenes"></panel-examenes>
                    <div class="acciones">
                        <button id="guardar" type="button" class="primario">Guardar atención</button>
                        <button id="retroceder" type="button" class="secundario">← Devolver paso</button>
                        <button id="avanzar" type="button" class="primario">Completar y avanzar →</button>
                        <button id="finalizar" type="button" class="secundario">Finalizar consulta</button>
                    </div>
                </section>
            </div>
            <motivo-devolucion id="motivo"></motivo-devolucion>
        `;
        return contenedor;
    }

    conectado() {
        this.mensaje = this.q("#mensaje");
        this.contenido = this.q("#contenido");
        this.panelExamenes = this.q("#panelExamenes");
        this.motivo = this.q("#motivo");
        this.idConsulta = this.parametros.get("id");
        this.q("#procedimiento").addEventListener("change", evento => {
            this.seleccionarProcedimiento(evento.target.value);
        });
        this.q("#agregar").addEventListener("click", () => this.agregarProcedimiento());
        this.q("#guardar").addEventListener("click", () => this.guardar(false));
        this.q("#avanzar").addEventListener("click", () => this.guardar(true));
        this.q("#retroceder").addEventListener("click", () => this.retroceder());
        this.q("#finalizar").addEventListener("click", () => this.finalizar());
        this.q("#estado").addEventListener("change", () => this.actualizarBotones());
        this.motivo.addEventListener("motivo-confirmado", evento =>
            this.devolverPaso(evento.detail.motivo, evento.detail.paso));
        if (!this.conectadoABackend) {
            this.aplicarConectividad(false);
            return;
        }
        if (!sesion.activa) {
            this.mensaje.mostrar("error", "Debe iniciar sesión para atender una consulta.");
            return;
        }
        if (!sesion.bloqueado) {
            this.mensaje.mostrar("error", "Confirme la clínica y el rol antes de atender una consulta.");
            return;
        }
        if (!this.idConsulta) {
            this.mensaje.mostrar("error", "Seleccione una consulta desde el dashboard.");
            return;
        }
        this.cargar();
    }

    aplicarConectividad(conectado) {
        if (!this.mensaje) {
            return;
        }
        let reconectando = this._conectado === false && conectado;
        this._conectado = conectado;
        if (!conectado) {
            this.contenido.hidden = true;
            this.mensaje.mostrar("error", "Sin conexión con el backend. No puede atender consultas.");
        }
        ["#guardar", "#retroceder", "#avanzar", "#finalizar", "#agregar"].forEach(selector => {
            let boton = this.q(selector);
            if (boton) {
                boton.disabled = !conectado;
            }
        });
        if (reconectando && sesion.activa && sesion.bloqueado && this.idConsulta) {
            this.cargar();
        }
    }

    cargar() {
        if (!this.conectadoABackend) {
            this.aplicarConectividad(false);
            return Promise.resolve();
        }
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
        let idActual = this.idProcedimientoFijado || (mantenerSeleccion && this.procedimientoActual
            ? this.procedimientoActual.id : null);
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
            this.seleccionarProcedimiento(elegido.id, true, true);
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

    seleccionarProcedimiento(id, fijar = false, forzar = false) {
        let procedimiento = this.procedimientos.find(p => p.id === id) || this.procedimientos[0];
        if (!procedimiento) {
            return;
        }
        if (this.idProcedimientoFijado && !forzar && this.idProcedimientoFijado !== procedimiento.id) {
            this.mensaje.mostrar("info", "El procedimiento quedó fijado para esta atención.");
            this.q("#procedimiento").value = this.idProcedimientoFijado;
            return;
        }
        if (fijar) {
            this.idProcedimientoFijado = procedimiento.id;
        }
        this.procedimientoActual = procedimiento;
        this.indiceActual = this.indicePasoInicial();
        let select = this.q("#procedimiento");
        select.replaceChildren(...this.procedimientos.map(p => {
            let opcion = document.createElement("option");
            opcion.value = p.id;
            opcion.textContent = p.nombre;
            return opcion;
        }));
        select.value = procedimiento.id;
        select.disabled = Boolean(this.idProcedimientoFijado);
        this.q("#fijado").hidden = !this.idProcedimientoFijado;
        this.pintarPasos();
        this.pintarAtencion();
    }

    pasosActuales() {
        if (!this.procedimientoActual) {
            return [];
        }
        return pasosOrdenados(this.procedimientoActual.pasos, this.procedimientoActual.orden);
    }

    pasosAtendibles() {
        return this.pasosActuales().filter(paso => {
            let estado = String(paso && paso.estado || "").toUpperCase();
            return this.esPasoPropio(paso) && !esCompletado(paso) && estado !== "CANCELADO";
        });
    }

    pasosMostrables() {
        return this.pasosActuales().filter(paso => this.esPasoPropio(paso));
    }

    estadoMostrado(paso) {
        let estado = String(paso && paso.estado || "PENDIENTE").toUpperCase();
        let global = this.pasosActuales().indexOf(paso);
        if (paso && paso.estadoMostrado) {
            return String(paso.estadoMostrado).toUpperCase();
        }
        return global > 0 && estado === "EN_PROCESO" ? "COMPLETADO" : estado;
    }

    indicePasoInicial() {
        let pasos = this.pasosAtendibles();
        if (pasos.length === 0) {
            return -1;
        }
        let pendientes = pasos
            .map((paso, indice) => ({ paso, indice }))
            .filter(item => {
                let estado = String(item.paso.estado || "PENDIENTE").toUpperCase();
                return estado === "PENDIENTE" || estado === "EN_PROCESO";
            });
        return pendientes.length > 0 ? pendientes[0].indice : 0;
    }

    definicionDe(paso) {
        let id = idDePasoConsulta(paso);
        let definiciones = this.procedimientoActual ? this.procedimientoActual.definiciones || [] : [];
        return definiciones.find(d => d && d.idProcedimientoPaso === id)
            || (paso && paso.idProcedimientoPaso) || {};
    }

    idRolDePaso(paso) {
        return idRolDePaso(paso, this.definicionDe(paso));
    }

    esPasoPropio(paso) {
        if (!sesion.bloqueado) {
            return false;
        }
        let idRolSesion = sesion.rol ? sesion.rol.idRol : null;
        if (!idRolSesion) {
            return false;
        }
        let idRolPaso = this.idRolDePaso(paso);
        return Boolean(idRolPaso) && idRolPaso === idRolSesion;
    }

    pintarPasos() {
        let lista = this.q("#pasos");
        let pasos = this.pasosMostrables();
        if (pasos.length === 0) {
            let vacio = document.createElement("li");
            vacio.className = "meta";
            vacio.textContent = this.pasosActuales().length === 0
                ? "El procedimiento no tiene pasos registrados."
                : "No hay pasos pendientes para su rol.";
            lista.replaceChildren(vacio);
            return;
        }
        let atendibles = this.pasosAtendibles();
        if (atendibles.length === 0) {
            this.indiceActual = -1;
        } else if (this.indiceActual < 0 || this.indiceActual >= atendibles.length) {
            this.indiceActual = 0;
        }
        lista.replaceChildren(...pasos.map((paso, numero) => {
            let li = document.createElement("li");
            let editable = atendibles.indexOf(paso) >= 0;
            let indice = atendibles.indexOf(paso);
            let control = editable ? document.createElement("button") : document.createElement("div");
            if (editable) {
                control.type = "button";
            } else {
                control.className = "solo-lectura";
            }
            if (editable && indice === this.indiceActual) {
                control.setAttribute("aria-current", "step");
            }
            let numeroPaso = document.createElement("span");
            numeroPaso.textContent = String(numero + 1);
            let nombre = document.createElement("span");
            nombre.className = "nombre";
            let definicion = paso.idProcedimientoPaso || {};
            nombre.textContent = definicion.nombre || "Paso";
            let estado = document.createElement("span");
            let valorEstado = this.estadoMostrado(paso);
            estado.className = "estado " + valorEstado;
            estado.textContent = valorEstado.replace("_", " ");
            control.append(numeroPaso, nombre, estado);
            if (editable) {
                control.addEventListener("click", () => {
                    this.indiceActual = indice;
                    this.pintarPasos();
                    this.pintarAtencion();
                });
            }
            li.appendChild(control);
            return li;
        }));
    }

    pasoActual() {
        return this.pasosAtendibles()[this.indiceActual] || null;
    }

    pintarAtencion() {
        let paso = this.pasoActual();
        if (!paso) {
            this.q("#atencion").classList.add("oculto");
            this.actualizarBotones();
            return;
        }
        this.q("#atencion").classList.remove("oculto");
        let definicion = this.definicionDe(paso);
        let propio = this.esPasoPropio(paso) && this.conectadoABackend;
        this.q("#tituloPaso").textContent = "Atención del paso: " + (definicion.nombre || "Paso");
        this.q("#metaPaso").textContent = "Inicio: " + formatearFecha(paso.fechaInicio);
        this.q("#valor").value = paso.valor || "";
        this.q("#estado").value = String(paso.estado || "PENDIENTE").toUpperCase();
        this.q("#valor").disabled = !propio;
        this.q("#estado").disabled = !propio;
        this.q("#guardar").disabled = !propio;
        this.panelExamenes.definicion = definicion.idProcedimientoPaso || null;
        this.panelExamenes.paso = paso;
        this.panelExamenes.pasos = this.procedimientoActual ? this.procedimientoActual.pasos : [];
        this.panelExamenes.editable = propio;
        if (propio) {
            this.q("#valor").focus();
        }
        this.actualizarBotones();
    }

    guardar(avanzar) {
        if (!this.conectadoABackend) {
            this.aplicarConectividad(false);
            return Promise.resolve(false);
        }
        let paso = this.pasoActual();
        if (!paso) {
            return Promise.resolve();
        }
        if (!this.esPasoPropio(paso)) {
            this.mensaje.mostrar("error", "Este paso corresponde a otro rol.");
            return Promise.resolve();
        }
        let valor = this.q("#valor").value.trim();
        let estado = this.q("#estado").value;
        if (!valor) {
            this.mensaje.mostrar("error", "Documente la atención antes de guardar.");
            this.q("#valor").focus();
            return Promise.resolve();
        }
        let actualizado = Object.assign({}, paso, { valor: valor, estado: estado });
        if (estado === "COMPLETADO") {
            actualizado.fechaFin = paso.fechaFin || ahoraISO();
        }
        let servicio = new ConsultaProcedimientoPasoService();
        this.mensaje.mostrar("cargando", "Guardando la atención…");
        return servicio.update(paso.idConsultaProcedimientoPaso, actualizado)
            .then(() => this.panelExamenes.guardar(paso))
            .then(() => {
                if (avanzar) {
                    return this.avanzar();
                }
                return true;
            })
            .then(resultado => {
                if (!resultado || resultado.continuar === false) {
                    return false;
                }
                if (resultado.salirAtencion) {
                    this.mensaje.mostrar("exito", "Paso completado. Las siguientes tareas pertenecen a otro rol.");
                    location.hash = "#/dashboard";
                    return false;
                }
                return this.recargarPasos(paso.idConsultaProcedimientoPaso).then(() => {
                    this.mensaje.mostrar("exito", "Atención guardada correctamente.");
                    return true;
                });
            })
            .catch(error => {
                this.mensaje.mostrar("error", error.message || "No se pudo guardar la atención.");
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
            let indice = this.pasosAtendibles()
                .findIndex(p => p.idConsultaProcedimientoPaso === idPasoSeleccionado);
            this.indiceActual = indice >= 0 ? indice : this.indicePasoInicial();
            this.pintarPasos();
            this.pintarAtencion();
        });
    }

    avanzar() {
        let procedimiento = this.procedimientoActual;
        let actual = this.pasoActual();
        if (!procedimiento || !actual) {
            return Promise.resolve({ continuar: false });
        }
        if (!this.esPasoPropio(actual)) {
            this.mensaje.mostrar("error", "Este paso corresponde a otro rol.");
            return Promise.resolve({ continuar: false });
        }
        let definiciones = procedimiento.orden || [];
        let posicion = definiciones.findIndex(d => d.idProcedimientoPaso === idDePasoConsulta(actual));
        if (posicion < 0 || posicion >= definiciones.length - 1) {
            this.mensaje.mostrar("info", "Este ya es el último paso del procedimiento.");
            return Promise.resolve({ continuar: false });
        }
        this.mensaje.mostrar("cargando", "Avanzando al siguiente paso…");
        return new ConsultaProcedimientoPasoService().avanzar(actual.idConsultaProcedimientoPaso)
            .then(respuesta => {
                let datos = respuesta && respuesta.datos ? respuesta.datos : {};
                return {
                    continuar: true,
                    salirAtencion: Boolean(datos.salirAtencion),
                    idRolSiguiente: datos.idRolSiguiente || null,
                    nombreRolSiguiente: datos.nombreRolSiguiente || null
                };
            })
            .catch(error => {
                this.mensaje.mostrar("error", error.message || "No se pudo avanzar de paso.");
                return { continuar: false };
            });
    }

    retroceder() {
        if (!this.conectadoABackend) {
            this.aplicarConectividad(false);
            return;
        }
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
        this.motivo.abrir(actual);
    }

    devolverPaso(motivo, pasoConfirmado = null) {
        if (!this.conectadoABackend) {
            this.aplicarConectividad(false);
            return Promise.resolve();
        }
        let paso = pasoConfirmado || this.pasoActual();
        if (!paso || !motivo) {
            return Promise.resolve();
        }
        let nombrePaso = paso.idProcedimientoPaso && paso.idProcedimientoPaso.nombre
            ? paso.idProcedimientoPaso.nombre : "Paso";
        let aviso = "Devolución desde " + nombrePaso + ": " + motivo;
        let valor = [String(paso.valor || "").trim(), aviso].filter(Boolean).join("\n");
        let servicio = new ConsultaProcedimientoPasoService();
        this.mensaje.mostrar("cargando", "Devolviendo el paso…");
        return servicio.update(paso.idConsultaProcedimientoPaso, Object.assign({}, paso, { valor: valor }))
            .then(() => servicio.retroceder(paso.idConsultaProcedimientoPaso, aviso))
            .then(() => this.recargarPasos(paso.idConsultaProcedimientoPaso))
            .then(() => {
                this.mensaje.mostrar("exito", "Paso devuelto con el motivo registrado.");
                location.hash = "#/dashboard";
            })
            .catch(error => {
                this.mensaje.mostrar("error", error.message || "No se pudo devolver el paso.");
            });
    }

    agregarProcedimiento() {
        if (!this.conectadoABackend) {
            this.aplicarConectividad(false);
            return;
        }
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

    actualizarBotones() {
        let paso = this.pasoActual();
        let estado = this.q("#estado") ? this.q("#estado").value : "";
        let definiciones = this.procedimientoActual && this.procedimientoActual.orden
            ? this.procedimientoActual.orden : [];
        let posicion = paso
            ? definiciones.findIndex(d => d.idProcedimientoPaso === idDePasoConsulta(paso)) : -1;
        let completado = estado === "COMPLETADO";
        let propio = paso ? this.esPasoPropio(paso) : false;
        let enLinea = this.conectadoABackend;
        let haySiguiente = posicion >= 0 && posicion < definiciones.length - 1;
        let esUltimo = definiciones.length > 0 && posicion === definiciones.length - 1;
        this.q("#retroceder").disabled = !enLinea || !propio || posicion <= 0;
        this.q("#avanzar").disabled = !enLinea || !propio || !completado || !haySiguiente;
        this.q("#finalizar").disabled = !enLinea || !propio || !completado || !esUltimo;
    }

    finalizar() {
        if (!this.conectadoABackend) {
            this.aplicarConectividad(false);
            return Promise.resolve();
        }
        if (this.q("#finalizar").disabled) {
            return Promise.resolve();
        }
        let paso = this.pasoActual();
        let procedimiento = this.procedimientoActual;
        if (!paso || !procedimiento) {
            return Promise.resolve();
        }
        let valor = this.q("#valor").value.trim();
        if (!valor) {
            this.mensaje.mostrar("error", "Documente la atención antes de finalizar.");
            this.q("#valor").focus();
            return Promise.resolve();
        }
        let fin = ahoraISO();
        let pasoService = new ConsultaProcedimientoPasoService();
        let procedimientoService = new ConsultaProcedimientoService();
        let actualizado = Object.assign({}, paso, {
            valor: valor,
            estado: "COMPLETADO",
            fechaFin: paso.fechaFin || fin
        });
        this.mensaje.mostrar("cargando", "Finalizando el procedimiento…");
        return pasoService.update(paso.idConsultaProcedimientoPaso, actualizado)
            .then(() => this.panelExamenes.guardar(paso))
            .then(() => procedimientoService.findById(procedimiento.id))
            .then(respuesta => {
                let entidad = respuesta.datos || {};
                let completa = Object.assign({}, entidad, {
                    idConsultaProcedimiento: procedimiento.id,
                    observaciones: entidad.observaciones || "Procedimiento finalizado",
                    fechaFin: fin
                });
                return procedimientoService.update(procedimiento.id, completa);
            })
            .then(() => {
                this.mensaje.mostrar("exito", "Procedimiento finalizado correctamente.");
                location.hash = "#/dashboard";
            })
            .catch(error => {
                this.mensaje.mostrar("error", error.message || "No se pudo finalizar el procedimiento.");
            });
    }
}
customElements.define("pagina-atencion", PaginaAtencion);
export default PaginaAtencion;
