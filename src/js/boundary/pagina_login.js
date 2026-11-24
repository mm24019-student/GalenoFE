import PaginaBase from "./pagina_base.js";
import "./selector_documento.js";
import "./mensaje_panel.js";
import { buscarIdentidad } from "../control/identidad.js";
import { sesion } from "../control/sesion.js";
import { asignacionesEmpleado, nombreClinica, nombreCompleto, nombreRol } from "../model/citas.js";

/**
 * Identificación del empleado con tipo y número de documento. Al validar
 * la identidad se listan sus clínicas y roles de empleado; al entrar, la
 * sesión queda disponible para el dashboard y la atención.
 */
class PaginaLogin extends PaginaBase {

    get titulo() {
        return "Iniciar sesión";
    }

    constructor() {
        super();
        this.identidad = null;
        this.asignaciones = [];
    }

    contenido() {
        let contenedor = document.createElement("div");
        contenedor.innerHTML = `
            <link rel="stylesheet" href="recursos/estilos/paginas/pagina_login.css">
            <section class="intro">
                <h2>Acceso para empleados</h2>
                <p>Seleccione su tipo de documento y escriba su número para validar su identidad.</p>
            </section>
            <selector-documento id="selector"></selector-documento>
            <mensaje-panel id="mensaje" oculto></mensaje-panel>
            <section id="resultado" hidden></section>
        `;
        return contenedor;
    }

    conectado() {
        this.mensaje = this.q("#mensaje");
        this.selector = this.q("#selector");
        this.resultado = this.q("#resultado");
        this.selector.addEventListener("documento-buscado", evento => this.identificar(evento.detail));
        this.selector.addEventListener("error", evento => this.error(evento.detail));
    }

    aplicarConectividad(conectado) {
        if (!this.mensaje || !this.selector) {
            return;
        }
        this.selector.bloqueado = !conectado;
        if (!conectado) {
            this.mensaje.mostrar("error", "Sin conexión con el backend. No puede iniciar sesión.");
        }
    }

    error(mensaje) {
        this.mensaje.mostrar("error", mensaje instanceof Error ? mensaje.message : String(mensaje));
        this.selector.bloqueado = false;
        this.selector.listo();
    }

    identificar(datos) {
        if (!this.conectadoABackend) {
            this.aplicarConectividad(false);
            return;
        }
        this.mensaje.mostrar("cargando", "Validando identidad…");
        buscarIdentidad(datos.tipo, datos.valor).then(identidad => {
            this.identidad = identidad;
            this.asignaciones = asignacionesEmpleado(identidad.asignaciones);
            this.selector.listo();
            if (this.asignaciones.length === 0) {
                this.resultado.hidden = true;
                this.selector.bloqueado = false;
                this.mensaje.mostrar("error",
                    "La persona no tiene un rol de empleado asignado en ninguna clínica.");
                return;
            }
            this.selector.bloqueado = true;
            this.pintarResultado();
            this.mensaje.mostrar("exito", "Identidad validada. Revise sus roles y confirme el ingreso.");
        }).catch(error => {
            this.identidad = null;
            this.asignaciones = [];
            this.resultado.hidden = true;
            this.error(error);
        });
    }

    pintarResultado() {
        let tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta";
        let titulo = document.createElement("h2");
        titulo.textContent = "Hola, " + nombreCompleto(this.identidad.persona);
        let persona = document.createElement("p");
        persona.className = "persona";
        persona.textContent = "Estos son los roles que puede usar hoy:";
        let lista = document.createElement("ul");
        this.asignaciones.forEach(asignacion => {
            let item = document.createElement("li");
            let rol = document.createElement("span");
            rol.className = "rol";
            rol.textContent = nombreRol(asignacion) || "Rol";
            item.appendChild(rol);
            item.appendChild(document.createTextNode(" · " + (nombreClinica(asignacion) || "Sin clínica")));
            lista.appendChild(item);
        });
        let entrar = document.createElement("button");
        entrar.type = "button";
        entrar.className = "entrar";
        entrar.textContent = "Entrar al sistema";
        entrar.addEventListener("click", () => this.entrar());
        let nota = document.createElement("p");
        nota.className = "nota";
        nota.textContent = "En el dashboard podrá elegir la clínica y el rol con el que desea trabajar.";
        tarjeta.append(titulo, persona, lista, entrar, nota);
        this.resultado.replaceChildren(tarjeta);
        this.resultado.hidden = false;
        entrar.focus();
    }

    entrar() {
        if (!this.conectadoABackend) {
            this.aplicarConectividad(false);
            return;
        }
        sesion.iniciar(this.identidad.persona, this.asignaciones);
        location.hash = "#/dashboard";
    }
}
customElements.define("pagina-login", PaginaLogin);
export default PaginaLogin;
