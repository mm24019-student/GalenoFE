import { sesion as sesionGlobal } from "../control/sesion.js";

/**
 * Opciones del menu segun haya o no una sesion iniciada.
 * Para agregar una pantalla al menu basta con sumar una linea aqui.
 */
export function opcionesDeMenu(sesionActiva) {
    let opciones = [{ texto: "Búsqueda de citas", ruta: "#/busqueda" }];
    if (sesionActiva) {
        opciones.push({ texto: "Gestiones", ruta: "#/dashboard" });
        opciones.push({ texto: "Cerrar sesión", accion: "cerrar" });
    } else {
        opciones.push({ texto: "Iniciar sesión", ruta: "#/login" });
    }
    return opciones;
}

/**
 * <galeno-nav>
 * Menu lateral. Se vuelve a pintar solo cuando cambia la sesion o la ruta.
 */
class GalenoNav extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.sesion = sesionGlobal;
        this.alCambiar = () => this.pintar();
    }

    connectedCallback() {
        window.addEventListener("hashchange", this.alCambiar);
        this.sesion.addEventListener("cambio", this.alCambiar);
        this.pintar();
    }

    disconnectedCallback() {
        window.removeEventListener("hashchange", this.alCambiar);
        this.sesion.removeEventListener("cambio", this.alCambiar);
    }

    pintar() {
        let estilo = document.createElement("link");
        estilo.rel = "stylesheet";
        estilo.href = "recursos/estilos/componentes/galeno_nav.css";
        let marca = document.createElement("div");
        marca.className = "marca";
        let logo = document.createElement("img");
        logo.src = "recursos/iconos/logoGaleno2609.png";
        logo.alt = "GalenoSV";
        marca.appendChild(logo);
        let lista = document.createElement("ul");
        opcionesDeMenu(this.sesion.activa).forEach(o => {
            let item = document.createElement("li");
            let control;
            if (o.accion === "cerrar") {
                control = document.createElement("button");
                control.type = "button";
                control.addEventListener("click", () => {
                    location.hash = "#/busqueda"; // primero se sale de la pantalla privada
                    this.sesion.cerrar();
                });
            } else {
                control = document.createElement("a");
                control.href = o.ruta;
                if (location.hash === o.ruta) {
                    control.setAttribute("aria-current", "page");
                }
            }
            control.textContent = o.texto;
            item.appendChild(control);
            lista.appendChild(item);
        });
        let nav = document.createElement("nav");
        nav.setAttribute("aria-label", "Menú principal");
        nav.appendChild(marca);
        nav.appendChild(lista);
        this.root.replaceChildren(estilo, nav);
    }
}
customElements.define("galeno-nav", GalenoNav);
export default GalenoNav;