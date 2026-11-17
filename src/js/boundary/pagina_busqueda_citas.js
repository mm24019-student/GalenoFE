import PaginaBase from "./pagina_base.js";
import "./selector_documento.js";
import "./mensaje_panel.js";
import "./tarjeta_cita.js";
import "./aviso_instalar_app.js";
import ConsultaService from "../control/consulta_service.js";
import ConsultaProcedimientoService from "../control/consulta_procedimiento_service.js";
import ProcedimientoService from "../control/procedimiento_service.js";
import { buscarIdentidad } from "../control/identidad.js";
import { clinicasDePaciente, nombreCompleto } from "../model/citas.js";
import { hoyISO, sumarDiasISO } from "../model/fechas.js";

/**
 * HU1: busqueda publica de citas. Identifica a la persona por documento,
 * limita las clinicas a aquellas donde es paciente y muestra las citas como
 * cards con su comprobante PDF generado por el backend.
 */
class PaginaBusquedaCitas extends PaginaBase {

    get titulo() {
        return "Búsqueda de citas";
    }

    get historia() {
        return "HU1";
    }

    constructor() {
        super();
        this.paciente = null;
        this.asignaciones = [];
        this.citas = [];
        this.catalogoProcedimientos = null;
    }

    contenido() {
        let contenedor = document.createElement("div");
        contenedor.innerHTML = `
            <link rel="stylesheet" href="recursos/estilos/paginas/pagina_busqueda_citas.css">
            <section class="intro">
                <h2>Encuentre sus citas médicas</h2>
                <p>Elija el tipo de documento, escriba su número y seleccione la clínica donde está registrado como paciente.</p>
            </section>
            <selector-documento id="selector"></selector-documento>
            <mensaje-panel id="mensaje" oculto></mensaje-panel>
            <section id="filtros" hidden>
                <div class="rejilla">
                    <div>
                        <label for="clinica">Clínica</label>
                        <select id="clinica"></select>
                    </div>
                    <div>
                        <label for="desde">Desde</label>
                        <input id="desde" type="date">
                    </div>
                    <div>
                        <label for="hasta">Hasta</label>
                        <input id="hasta" type="date">
                    </div>
                    <div class="acciones">
                        <button id="buscarCitas" type="button">Buscar citas</button>
                    </div>
                </div>
                <p class="paciente" id="paciente"></p>
            </section>
            <section id="resultados" hidden>
                <div class="titulo-resultados">
                    <h2>Resultados</h2>
                    <span class="conteo" id="conteo"></span>
                </div>
                <div class="cuadricula" id="cuadricula"></div>
            </section>
            <aviso-instalar-app id="avisoInstalar"></aviso-instalar-app>
        `;
        return contenedor;
    }

    conectado() {
        this.mensaje = this.root.querySelector("#mensaje");
        this.selector = this.root.querySelector("#selector");
        this.filtros = this.root.querySelector("#filtros");
        this.resultados = this.root.querySelector("#resultados");
        this.avisoInstalar = this.root.querySelector("#avisoInstalar");
        this.desde = this.root.querySelector("#desde");
        this.hasta = this.root.querySelector("#hasta");
        this.desde.value = sumarDiasISO(hoyISO(), -30);
        this.hasta.value = sumarDiasISO(hoyISO(), 30);

        this.selector.addEventListener("documento-buscado", evento => this.buscarPaciente(evento.detail));
        this.selector.addEventListener("error", evento => this.error(evento.detail));
        this.root.querySelector("#buscarCitas").addEventListener("click", () => this.buscarCitas());
        this.root.querySelector("#cuadricula").addEventListener("descargar-ticket", evento => {
            this.descargarTicket(evento.detail.cita);
        });
    }

    error(texto) {
        this.mensaje.mostrar("error", texto instanceof Error ? texto.message : String(texto));
        this.selector.listo();
    }

    buscarPaciente(datos) {
        this.mensaje.mostrar("cargando", "Buscando la identidad y sus clínicas…");
        buscarIdentidad(datos.tipo, datos.valor).then(identidad => {
            this.paciente = identidad.persona;
            this.asignaciones = identidad.asignaciones;
            let clinicas = clinicasDePaciente(this.asignaciones);
            this.selector.listo();
            this.resultados.hidden = true;
            this.root.querySelector("#cuadricula").replaceChildren();
            if (clinicas.length === 0) {
                this.filtros.hidden = true;
                this.mensaje.mostrar("error",
                    "La persona no está registrada como paciente en ninguna clínica.");
                return;
            }
            this.root.querySelector("#paciente").textContent =
                "Paciente: " + nombreCompleto(this.paciente);
            let select = this.root.querySelector("#clinica");
            select.replaceChildren(...clinicas.map(clinica => {
                let opcion = document.createElement("option");
                opcion.value = clinica.idClinica;
                opcion.textContent = clinica.nombre;
                return opcion;
            }));
            this.filtros.hidden = false;
            this.mensaje.mostrar("exito",
                "Identidad confirmada. Seleccione el rango de fechas y busque sus citas.");
        }).catch(error => {
            this.filtros.hidden = true;
            this.paciente = null;
            this.error(error);
        });
    }

    buscarCitas() {
        if (!this.paciente) {
            this.mensaje.mostrar("error", "Primero identifíquese con su documento.");
            return;
        }
        if (this.desde.value && this.hasta.value && this.desde.value > this.hasta.value) {
            this.mensaje.mostrar("error", "La fecha \"Desde\" no puede ser posterior a \"Hasta\".");
            return;
        }
        let servicio = new ConsultaService();
        this.mensaje.mostrar("cargando", "Buscando citas…");
        servicio.buscar({
            tipoDocumento: this.selector.tipo,
            valorDocumento: this.selector.valor.trim(),
            idClinica: this.root.querySelector("#clinica").value,
            desde: this.desde.value,
            hasta: this.hasta.value
        }).then(resp => {
            this.citas = resp.datos || [];
            return this.cargarProcedimientos(this.citas);
        }).then(() => {
            this.pintarCitas();
        }).catch(error => {
            this.mensaje.mostrar("error", error.message || "No se pudieron cargar las citas.");
        });
    }

    cargarProcedimientos(citas) {
        if (!this.catalogoProcedimientos) {
            return new ProcedimientoService().findRange(0, 200).then(resp => {
                this.catalogoProcedimientos = new Map();
                (resp.datos || []).forEach(p => this.catalogoProcedimientos.set(p.idProcedimiento, p.nombre));
                return this.procedimientosDeCitas(citas);
            }).catch(() => {
                this.catalogoProcedimientos = new Map();
                return this.procedimientosDeCitas(citas);
            });
        }
        return this.procedimientosDeCitas(citas);
    }

    procedimientosDeCitas(citas) {
        let servicio = new ConsultaProcedimientoService();
        return Promise.all(citas.map(cita => servicio.porConsulta(cita.idConsulta)
            .then(resp => resp.datos || [])
            .catch(() => []))).then(listas => {
            citas.forEach((cita, indice) => {
                cita._procedimientos = listas[indice].map(cp =>
                    (this.catalogoProcedimientos && this.catalogoProcedimientos.get(cp.idProcedimiento))
                    || "Procedimiento");
            });
        });
    }

    pintarCitas() {
        let cuadricula = this.root.querySelector("#cuadricula");
        this.resultados.hidden = false;
        this.root.querySelector("#conteo").textContent = this.citas.length === 1
            ? "1 cita encontrada"
            : this.citas.length + " citas encontradas";
        if (this.citas.length === 0) {
            let vacio = document.createElement("mensaje-panel");
            vacio.mostrar("info", "No hay citas para los filtros seleccionados.");
            cuadricula.replaceChildren(vacio);
            this.mensaje.ocultar();
            return;
        }
        cuadricula.replaceChildren(...this.citas.map(cita => {
            let tarjeta = document.createElement("tarjeta-cita");
            tarjeta.procedimientos = cita._procedimientos || [];
            tarjeta.cita = cita;
            return tarjeta;
        }));
        this.mensaje.mostrar("exito", "Citas cargadas correctamente.");
    }

    descargarTicket(cita) {
        if (!cita || !cita.idConsulta) {
            return;
        }
        if (this.avisoInstalar) {
            this.avisoInstalar.mostrar();
        }
        this.mensaje.mostrar("cargando", "Generando el comprobante en el servidor…");
        new ConsultaService().descargarTicket(cita.idConsulta).then(blob => {
            let url = URL.createObjectURL(blob);
            let enlace = document.createElement("a");
            enlace.href = url;
            enlace.download = "cita-" + cita.idConsulta + ".pdf";
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            URL.revokeObjectURL(url);
            this.mensaje.mostrar("exito", "Comprobante PDF descargado.");
        }).catch(error => {
            this.mensaje.mostrar("error", error.message || "No se pudo descargar el comprobante.");
        });
    }
}
customElements.define("pagina-busqueda-citas", PaginaBusquedaCitas);
export default PaginaBusquedaCitas;
