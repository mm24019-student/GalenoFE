/**
 * Base de todas las pantallas de la SPA. Define el titulo, el contenido y los
 * estilos comunes de una pantalla. Las subclases implementan contenido() y,
 * si necesitan escuchar eventos, conectado().
 */
export default class PaginaBase extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this._parametros = new URLSearchParams();
        this.renderizada = false;
    }

    get titulo() {
        return "Pantalla";
    }

    get historia() {
        return "";
    }

    get parametros() {
        return this._parametros;
    }

    set parametros(valor) {
        this._parametros = valor instanceof URLSearchParams ? valor : new URLSearchParams(valor || "");
    }

    contenido() {
        let texto = document.createElement("p");
        texto.textContent = "Pantalla en construcción.";
        return texto;
    }

    conectado() {
        // Las subclases que necesiten listeners lo sobrescriben.
    }

    q(selector) {
        return this.root.querySelector(selector);
    }

    connectedCallback() {
        if (this.renderizada) {
            return;
        }
        this.renderizada = true;
        let estilo = document.createElement("link");
        estilo.rel = "stylesheet";
        estilo.href = "recursos/estilos/componentes/pagina_base.css";
        let cabecera = document.createElement("div");
        cabecera.className = "cabecera";
        let titulo = document.createElement("h1");
        titulo.textContent = this.titulo;
        cabecera.appendChild(titulo);
        if (this.historia) {
            let insignia = document.createElement("span");
            insignia.className = "historia";
            insignia.textContent = this.historia;
            cabecera.appendChild(insignia);
        }
        this.root.replaceChildren(estilo, cabecera, this.contenido());
        this.conectado();
    }
}
