import PaginaBase from "./pagina_base.js";
import "./mensaje_panel.js";
import "./selector_contexto.js";
import "./tarjeta_consulta.js";
import { sesion } from "../control/sesion.js";
import ConsultaService from "../control/consulta_service.js";
import ConsultaProcedimientoService from "../control/consulta_procedimiento_service.js";
import ConsultaProcedimientoPasoService from "../control/consulta_procedimiento_paso_service.js";
import ProcedimientoService from "../control/procedimiento_service.js";
import ProcedimientoPasoService from "../control/procedimiento_paso_service.js";
import ProcedimientoPasoSecuenciaService from "../control/procedimiento_paso_secuencia_service.js";
import { contextosDeEmpleado, nombreCompleto } from "../model/citas.js";
import { hoyISO } from "../model/fechas.js";
import { ordenarPasos } from "../model/secuencia.js";
import { construirHash } from "../model/rutas.js";

/**
 * Dashboard del empleado. Permite elegir la clínica y el rol, consultar
 * las citas por rango de fechas y ver, para cada consulta, los datos del
 * paciente, sus procedimientos y los pasos jerárquicos ya realizados.
 */
class PaginaDashboard extends PaginaBase {

    get titulo() {
        return "Dashboard del empleado";
    }

    constructor() {
        super();
        this.contextos = [];
        this.catalogoProcedimientos = new Map();
        this.citas = [];
        this.cargando = false;
    }

    contenido() {
        let contenedor = document.createElement("div");
        contenedor.innerHTML = `
            <link rel="stylesheet" href="recursos/estilos/paginas/pagina_dashboard.css">
            <section class="bienvenida">
                <div>
                    <h2 id="saludo">Bienvenido</h2>
                    <p>Seleccione la clínica y el rol con los que atenderá hoy.</p>
                </div>
            </section>
            <mensaje-panel id="mensaje" oculto></mensaje-panel>
            <selector-contexto id="contexto"></selector-contexto>
            <section id="consultas" hidden>
                <div class="fechas">
                    <div>
                        <label for="desde">Desde</label>
                        <input id="desde" type="date">
                    </div>
                    <div>
                        <label for="hasta">Hasta</label>
                        <input id="hasta" type="date">
                    </div>
                    <div class="acciones">
                        <button id="buscar" type="button">Buscar consultas</button>
                    </div>
                </div>
                <section id="resultados" hidden>
                    <div class="titulo-resultados">
                        <h2>Consultas</h2>
                        <span class="conteo" id="conteo"></span>
                    </div>
                    <div class="cuadricula" id="cuadricula"></div>
                </section>
            </section>
        `;
        return contenedor;
    }

    conectado() {
        this.mensaje = this.q("#mensaje");
        this.contexto = this.q("#contexto");
        this.consultas = this.q("#consultas");
        this.resultados = this.q("#resultados");
        this.q("#saludo").textContent = "Bienvenido, " + nombreCompleto(sesion.usuario);
        this.q("#desde").value = hoyISO();
        this.q("#hasta").value = hoyISO();

        this.contextos = contextosDeEmpleado(sesion.asignaciones);
        if (this.contextos.length === 0) {
            this.contexto.hidden = true;
            this.mensaje.mostrar("error",
                "Su usuario no tiene roles de empleado. Inicie sesión con un empleado.");
            return;
        }
        this.pintarContextos();
        this.contexto.addEventListener("contexto-confirmado", evento => {
            this.elegirContexto(evento.detail.contexto);
        });
        this.contexto.addEventListener("error", evento => {
            this.mensaje.mostrar("error", evento.detail.message || "Seleccione un contexto válido.");
        });
        this.q("#buscar").addEventListener("click", () => this.buscarConsultas());
        this.q("#cuadricula").addEventListener("atender", evento => {
            let id = evento.detail.consulta.idConsulta;
            location.hash = construirHash("/atencion", { id: id });
        });

        if (sesion.clinica && sesion.rol) {
            this.contexto.seleccionActual = sesion;
            this.contexto.bloqueado = sesion.bloqueado;
            this.consultas.hidden = false;
            if (sesion.bloqueado) {
                this.buscarConsultas();
            }
        }
        this.cargarCatalogo();
    }

    pintarContextos() {
        this.contexto.contextos = this.contextos;
        if (sesion.clinica || sesion.rol) {
            this.contexto.seleccionActual = sesion;
        }
    }

    pintarRoles() {
        this.pintarContextos();
    }

    elegirContexto(contexto) {
        let elegido = contexto || this.contexto.seleccion;
        if (!elegido) {
            this.mensaje.mostrar("error", "Seleccione una clínica y un rol válidos.");
            return;
        }
        if (sesion.bloqueado) {
            this.mensaje.mostrar("info", "El rol de atención ya está confirmado.");
            this.consultas.hidden = false;
            return;
        }
        sesion.confirmarContexto(elegido.clinica, elegido.rol);
        this.contexto.bloqueado = true;
        this.consultas.hidden = false;
        this.mensaje.mostrar("exito",
            "Trabajando como " + elegido.rol.nombre + " en " + elegido.clinica.nombre + ".");
        this.buscarConsultas();
    }

    cargarCatalogo() {
        new ProcedimientoService().findRange(0, 200).then(resp => {
            this.catalogoProcedimientos = new Map();
            (resp.datos || []).forEach(p => this.catalogoProcedimientos.set(p.idProcedimiento, p.nombre));
        }).catch(() => {
            // Si falla el catalogo, las tarjetas muestran "Procedimiento".
        });
    }

    buscarConsultas() {
        if (!sesion.clinica || !sesion.rol) {
            this.mensaje.mostrar("error", "Primero seleccione la clínica y el rol.");
            return;
        }
        if (this.q("#desde").value && this.q("#hasta").value
                && this.q("#desde").value > this.q("#hasta").value) {
            this.mensaje.mostrar("error", "La fecha \"Desde\" no puede ser posterior a \"Hasta\".");
            return;
        }
        this.cargando = true;
        this.resultados.hidden = true;
        this.mensaje.mostrar("cargando", "Buscando consultas…");
        new ConsultaService().buscar({
            idClinica: sesion.clinica.idClinica,
            idRol: sesion.rol.idRol,
            desde: this.q("#desde").value,
            hasta: this.q("#hasta").value
        }).then(resp => {
            this.citas = resp.datos || [];
            this.pintarConsultas();
            this.mensaje.mostrar("exito", "Consultas cargadas.");
        }).catch(error => {
            this.mensaje.mostrar("error", error.message || "No se pudieron cargar las consultas.");
        }).then(() => {
            this.cargando = false;
        });
    }

    pintarConsultas() {
        this.resultados.hidden = false;
        this.q("#conteo").textContent = this.citas.length === 1
            ? "1 consulta" : this.citas.length + " consultas";
        let cuadricula = this.q("#cuadricula");
        if (this.citas.length === 0) {
            let vacio = document.createElement("mensaje-panel");
            vacio.mostrar("info", "No hay consultas para la clínica y fechas seleccionadas.");
            cuadricula.replaceChildren(vacio);
            return;
        }
        let tarjetas = this.citas.map(cita => {
            let tarjeta = document.createElement("tarjeta-consulta");
            tarjeta.idRol = sesion.rol ? sesion.rol.idRol : null;
            tarjeta.consulta = cita;
            tarjeta.detalle = null;
            this.cargarDetalle(cita, tarjeta);
            return tarjeta;
        });
        cuadricula.replaceChildren(...tarjetas);
    }

    cargarDetalle(cita, tarjeta) {
        let cpService = new ConsultaProcedimientoService();
        let pasoService = new ConsultaProcedimientoPasoService();
        let definicionService = new ProcedimientoPasoService();
        let secuenciaService = new ProcedimientoPasoSecuenciaService();
        cpService.porConsulta(cita.idConsulta).then(resp => {
            let procedimientos = resp.datos || [];
            return Promise.all(procedimientos.map(cp => {
                return Promise.all([
                    definicionService.porProcedimiento(cp.idProcedimiento).then(r => r.datos || []).catch(() => []),
                    secuenciaService.porProcedimiento(cp.idProcedimiento).then(r => r.datos || []).catch(() => []),
                    pasoService.porConsultaProcedimiento(cp.idConsultaProcedimiento).then(r => r.datos || []).catch(() => [])
                ]).then(([definiciones, secuencias, pasos]) => ({
                    id: cp.idConsultaProcedimiento,
                    nombre: this.catalogoProcedimientos.get(cp.idProcedimiento) || "Procedimiento",
                    fechaInicio: cp.fechaInicio,
                    orden: ordenarPasos(definiciones, secuencias),
                    pasos: pasos
                }));
            }));
        }).then(procedimientos => {
            tarjeta.detalle = { procedimientos: procedimientos };
        }).catch(() => {
            tarjeta.detalle = { procedimientos: [] };
        });
    }
}
customElements.define("pagina-dashboard", PaginaDashboard);
export default PaginaDashboard;
