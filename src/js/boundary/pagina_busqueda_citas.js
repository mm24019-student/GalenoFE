import PaginaBase from "./pagina_base.js";
import "./selector_documento.js";
import "./mensaje_panel.js";
import "./tarjeta_cita.js";
import ConsultaService from "../control/consulta_service.js";
import ConsultaProcedimientoService from "../control/consulta_procedimiento_service.js";
import ProcedimientoService from "../control/procedimiento_service.js";
import { buscarIdentidad } from "../control/identidad.js";
import { asignacionPacienteEnClinica, clinicasDePaciente, nombreCompleto } from "../model/citas.js";
import { hoyISO, sumarDiasISO } from "../model/fechas.js";

/**
 * Busqueda publica de citas. Identifica a la persona por documento,
 * limita las clinicas a aquellas donde es paciente y muestra las citas como
 * cards con su comprobante PDF generado por el backend.
 */
class PaginaBusquedaCitas extends PaginaBase {

    get titulo() {
        return "Búsqueda de citas";
    }

    constructor() {
        super();
        this.paciente = null;
        this.tipoDocumento = null;
        this.valorDocumento = null;
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
            <div id="vistaPrevia"></div>
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
        `;
        return contenedor;
    }

    conectado() {
        this.mensaje = this.root.querySelector("#mensaje");
        this.selector = this.root.querySelector("#selector");
        this.filtros = this.root.querySelector("#filtros");
        this.resultados = this.root.querySelector("#resultados");
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

    disconnectedCallback() {
        if (this.cerrarVista) {
            this.cerrarVista();
        }
    }

    error(texto) {
        this.mensaje.mostrar("error", texto instanceof Error ? texto.message : String(texto));
        this.selector.listo();
    }

    buscarPaciente(datos) {
        this.paciente = null;
        this.tipoDocumento = null;
        this.valorDocumento = null;
        this.asignaciones = [];
        this.filtros.hidden = true;
        this.resultados.hidden = true;
        this.root.querySelector("#cuadricula").replaceChildren();
        this.root.querySelector("#paciente").textContent = "";
        this.mensaje.mostrar("cargando", "Buscando la identidad y sus clínicas…");
        buscarIdentidad(datos.tipo, datos.valor).then(identidad => {
            this.paciente = identidad.persona;
            this.tipoDocumento = String(datos.tipo || "").trim();
            this.valorDocumento = String(datos.valor || "").trim();
            this.asignaciones = identidad.asignaciones;
            let clinicas = clinicasDePaciente(this.asignaciones);
            this.selector.listo();
            if (clinicas.length === 0) {
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
            this.tipoDocumento = null;
            this.valorDocumento = null;
            this.asignaciones = [];
            this.error(error);
        });
    }

    buscarCitas() {
        if (!this.paciente || !this.tipoDocumento || !this.valorDocumento) {
            this.mensaje.mostrar("error", "Primero identifíquese con su documento.");
            return;
        }
        if (this.desde.value && this.hasta.value && this.desde.value > this.hasta.value) {
            this.mensaje.mostrar("error", "La fecha \"Desde\" no puede ser posterior a \"Hasta\".");
            return;
        }
        let idClinica = this.root.querySelector("#clinica").value;
        let asignacion = asignacionPacienteEnClinica(this.asignaciones, idClinica);
        let servicio = new ConsultaService();
        this.mensaje.mostrar("cargando", "Buscando citas…");
        servicio.buscar({
            tipoDocumento: this.tipoDocumento,
            valorDocumento: this.valorDocumento,
            idPersona: this.paciente.idPersona,
            idPersonaRol: asignacion ? asignacion.idPersonaRol : null,
            idClinica: idClinica,
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
        let aviso = document.getElementById("avisoInstalarGlobal");
        if (aviso && typeof aviso.mostrar === "function") {
            aviso.mostrar();
        }
        this.mensaje.mostrar("cargando", "Generando el comprobante en el servidor…");
        new ConsultaService().descargarTicket(cita.idConsulta).then(blob => {
            this.mostrarVistaPrevia(blob, cita);
        }).catch(error => {
            this.mensaje.mostrar("error", error.message || "No se pudo mostrar el comprobante.");
        });
    }

    mostrarVistaPrevia(blob, cita) {
        if (this.cerrarVista) {
            this.cerrarVista();
        }
        let url = URL.createObjectURL(blob);
        let nombre = "cita-" + cita.idConsulta + ".pdf";
        let capa = document.createElement("div");
        capa.setAttribute("role", "dialog");
        capa.setAttribute("aria-modal", "true");
        capa.setAttribute("aria-label", "Vista previa del comprobante");
        capa.style.cssText = "position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:1rem;background:rgba(11,25,40,.55)";
        capa.innerHTML = `
            <section style="display:flex;flex-direction:column;width:min(920px,100%);max-height:92vh;overflow:hidden;background:#fff;border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.3)">
                <header style="display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem 1rem;border-bottom:1px solid #d5dae0">
                    <h3 style="margin:0;font-size:1.1rem;color:#2b3138">Vista previa del comprobante</h3>
                    <button id="cerrar" type="button" aria-label="Cerrar vista previa" style="border:0;background:transparent;font-size:1.5rem;line-height:1;cursor:pointer">×</button>
                </header>
                <iframe id="pdf" title="Comprobante PDF" style="flex:1;width:100%;min-height:60vh;border:0;background:#f4f6f8"></iframe>
                <p style="margin:0;padding:.5rem 1rem;font-size:.85rem;color:#6b7686">Si el documento no aparece, use el botón Descargar PDF.</p>
                <footer style="display:flex;justify-content:flex-end;gap:.5rem;padding:.75rem 1rem;border-top:1px solid #d5dae0">
                    <button id="cancelar" type="button" style="font:inherit;padding:.6rem 1rem;border:1px solid #b9d8f5;border-radius:8px;background:#fff;color:#0b3d6b;cursor:pointer">Cancelar</button>
                    <button id="descargar" type="button" style="font:inherit;padding:.6rem 1rem;border:1px solid #007bff;border-radius:8px;background:#007bff;color:#fff;cursor:pointer">Descargar PDF</button>
                </footer>
            </section>
        `;
        let cerrada = false;
        let cerrar = () => {
            if (cerrada) {
                return;
            }
            cerrada = true;
            capa.remove();
            URL.revokeObjectURL(url);
            if (this.cerrarVista === cerrar) {
                this.cerrarVista = null;
            }
        };
        capa.querySelector("#cerrar").addEventListener("click", () => {
            cerrar();
            this.mensaje.mostrar("info", "Vista previa cerrada. El comprobante no se descargó.");
        });
        capa.querySelector("#cancelar").addEventListener("click", () => {
            cerrar();
            this.mensaje.mostrar("info", "Vista previa cerrada. El comprobante no se descargó.");
        });
        capa.querySelector("#descargar").addEventListener("click", () => {
            let enlace = document.createElement("a");
            enlace.href = url;
            enlace.download = nombre;
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
            setTimeout(() => {
                cerrar();
                this.mensaje.mostrar("exito", "Comprobante PDF descargado.");
            }, 200);
        });
        capa.querySelector("#pdf").src = url;
        this.cerrarVista = cerrar;
        document.body.appendChild(capa);
        this.mensaje.mostrar("exito", "Vista previa del comprobante lista.");
    }
}
customElements.define("pagina-busqueda-citas", PaginaBusquedaCitas);
export default PaginaBusquedaCitas;
