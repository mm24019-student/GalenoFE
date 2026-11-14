/**
 * <instalar-app>
 * Boton de instalacion de la PWA. Usa el evento beforeinstallprompt para
 * guardar la invitacion del navegador y lanzarla cuando el usuario pulsa el
 * boton. Tambien se oculta si la app ya se esta ejecutando instalada.
 */
class InstalarApp extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.invitacion = null;
        this.alInstalar = evento => {
            evento.preventDefault();
            this.invitacion = evento;
            this.pintar();
        };
        this.alInstalada = () => {
            this.invitacion = null;
            this.pintar();
        };
    }

    connectedCallback() {
        window.addEventListener("beforeinstallprompt", this.alInstalar);
        window.addEventListener("appinstalled", this.alInstalada);
        this.pintar();
    }

    disconnectedCallback() {
        window.removeEventListener("beforeinstallprompt", this.alInstalar);
        window.removeEventListener("appinstalled", this.alInstalada);
    }

    get instalada() {
        return window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
    }

    pintar() {
        let estilo = document.createElement("style");
        estilo.textContent = `
            :host { display: block; }
            button {
                box-sizing: border-box;
                width: 100%;
                padding: var(--espacio-2) var(--espacio-3);
                border: 1px solid rgba(255, 255, 255, 0.55);
                border-radius: var(--radio);
                background: rgba(255, 255, 255, 0.12);
                color: #fff;
                font: inherit;
                cursor: pointer;
            }
            button:hover { background: rgba(255, 255, 255, 0.22); }
            button:focus-visible { outline: 3px solid var(--color-destacado); outline-offset: 2px; }
        `;
        if (!this.invitacion || this.instalada) {
            this.root.replaceChildren(estilo);
            return;
        }
        let boton = document.createElement("button");
        boton.type = "button";
        boton.textContent = "Instalar aplicación";
        boton.addEventListener("click", () => {
            if (!this.invitacion) {
                return;
            }
            this.invitacion.prompt();
            this.invitacion.userChoice.then(() => {
                this.invitacion = null;
                this.pintar();
            });
        });
        this.root.replaceChildren(estilo, boton);
    }
}
customElements.define("instalar-app", InstalarApp);
export default InstalarApp;
