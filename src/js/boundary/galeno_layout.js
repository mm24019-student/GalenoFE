const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/galeno_layout.css">
    <div class="pagina">
        <nav><slot name="nav"></slot></nav>
        <header>
            <slot name="logo"></slot>
            <slot name="titulo">Título</slot>
        </header>
        <main><slot name="cuerpo"></slot></main>
        <footer><slot name="pie"></slot></footer>
    </div>
`;

/**
 * <galeno-layout>
 * Estructura general de la pagina: menu a la izquierda, y a la derecha
 * encabezado (logo y titulo), cuerpo y pie de pagina.
 */
class GalenoLayout extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
    }
}
customElements.define("galeno-layout", GalenoLayout);
export default GalenoLayout;