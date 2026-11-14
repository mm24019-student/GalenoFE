const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/mensaje_panel.css">
    <div class="panel" role="status">
        <span class="icono" aria-hidden="true"></span>
        <p class="texto"></p>
    </div>
`;

/**
 * <mensaje-panel>
 * Panel accesible para mensajes informativos, errores, exitos y estados de
 * carga. Uso: panel.mostrar("error", "No se pudo conectar") / panel.ocultar()
 */
class MensajePanel extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
    }

    mostrar(tipo, texto) {
        let panel = this.root.querySelector(".panel");
        panel.className = "panel " + (tipo || "info");
        panel.setAttribute("role", tipo === "error" ? "alert" : "status");
        this.root.querySelector(".texto").textContent = texto || "";
        this.root.querySelector(".icono").textContent = {
            error: "⚠", exito: "✓", cargando: "⏳", info: "ℹ"
        }[tipo] || "ℹ";
        this.removeAttribute("oculto");
    }

    ocultar() {
        this.setAttribute("oculto", "");
    }
}
customElements.define("mensaje-panel", MensajePanel);
export default MensajePanel;
