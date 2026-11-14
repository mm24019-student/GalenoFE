import { sesion as sesionGlobal } from "../control/sesion.js";
import { RUTAS, NO_ENCONTRADA, resolverRuta } from "../model/rutas.js";

export { RUTAS, NO_ENCONTRADA, resolverRuta };

/**
 * <galeno-router>
 * Muestra el Web Component que corresponde al hash actual y reacciona a los
 * cambios de ruta y de sesion. La ruta y los parametros viven en el hash para
 * funcionar con cualquier servidor estatico.
 */
class GalenoRouter extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.sesion = sesionGlobal;
        this.claveActual = null;
        this.alCambiar = () => this.navegar(location.hash);
    }

    connectedCallback() {
        let estilo = document.createElement("style");
        estilo.textContent = `
            :host { display: block; }
            main { outline: none; min-height: 60vh; }
        `;
        this.principal = document.createElement("main");
        this.principal.setAttribute("tabindex", "-1");
        this.root.replaceChildren(estilo, this.principal);

        window.addEventListener("hashchange", this.alCambiar);
        this.sesion.addEventListener("cambio", this.alCambiar);
        this.navegar(location.hash, false);
    }

    disconnectedCallback() {
        window.removeEventListener("hashchange", this.alCambiar);
        this.sesion.removeEventListener("cambio", this.alCambiar);
    }

    navegar(hash, enfocar = true) {
        let resolucion = resolverRuta(hash, this.sesion.activa);
        if (resolucion.redirigir) {
            history.replaceState(null, "", resolucion.redirigir);
            return this.navegar(resolucion.redirigir, enfocar);
        }
        let clave = resolucion.ruta + "?" + (resolucion.parametros ? resolucion.parametros.toString() : "");
        if (this.claveActual === clave) {
            return;
        }
        this.claveActual = clave;
        let pagina = document.createElement(resolucion.definicion.componente);
        if (resolucion.parametros && "parametros" in pagina) {
            pagina.parametros = resolucion.parametros;
        }
        this.principal.replaceChildren(pagina);
        document.title = resolucion.definicion.titulo + " · GalenoSV";
        if (enfocar) {
            this.principal.focus();
        }
    }
}
customElements.define("galeno-router", GalenoRouter);
export default GalenoRouter;
