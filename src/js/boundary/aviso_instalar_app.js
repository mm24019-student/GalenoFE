const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/aviso_instalar_app.css">
    <aside class="aviso-instalar" part="aviso-instalar" role="status" aria-live="polite" hidden>
        <p class="aviso-instalar__titulo">Instalar aplicación</p>
        <p class="aviso-instalar__texto">¿Quieres estar al pendiente de tus citas? Descarga la app</p>
        <p class="aviso-instalar__nota" hidden>La instalación no está disponible en este momento. Usa la opción “Instalar app” del navegador si aparece.</p>
        <div class="aviso-instalar__acciones">
            <button type="button" class="aviso-instalar__instalar">Instalar</button>
            <button type="button" class="aviso-instalar__cerrar secundario" aria-label="Cerrar aviso">Cancelar</button>
        </div>
    </aside>
`;

const CLAVE_INSTALADA = "galeno-app-instalada";
let instalacionPendienteGlobal = null;

window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    instalacionPendienteGlobal = evento;
});

window.addEventListener("appinstalled", () => {
    instalacionPendienteGlobal = null;
    try {
        localStorage.setItem(CLAVE_INSTALADA, "1");
    } catch (e) {
    }
});

class AvisoInstalarApp extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
        this.alInstalar = () => this.actualizarEstado();
        this.alInstalada = () => {
            this.marcarInstalada();
            this.ocultar();
        };
    }

    instalada() {
        return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
            || window.navigator.standalone === true
            || localStorage.getItem(CLAVE_INSTALADA) === "1";
    }

    marcarInstalada() {
        try {
            localStorage.setItem(CLAVE_INSTALADA, "1");
        } catch (e) {
        }
    }

    connectedCallback() {
        this.aviso = this.root.querySelector(".aviso-instalar");
        this.botonInstalar = this.root.querySelector(".aviso-instalar__instalar");
        this.nota = this.root.querySelector(".aviso-instalar__nota");
        if (this.instalada()) {
            this.ocultar();
            return;
        }
        this.root.querySelector(".aviso-instalar__cerrar").addEventListener("click", () => this.ocultar());
        this.botonInstalar.addEventListener("click", async () => {
            if (!instalacionPendienteGlobal) {
                this.actualizarEstado();
                return;
            }
            const pendiente = instalacionPendienteGlobal;
            instalacionPendienteGlobal = null;
            pendiente.prompt();
            const eleccion = await pendiente.userChoice;
            if (eleccion && eleccion.outcome === "accepted") {
                this.marcarInstalada();
            }
            this.ocultar();
        });
        window.addEventListener("beforeinstallprompt", this.alInstalar);
        window.addEventListener("appinstalled", this.alInstalada);
        this.actualizarEstado();
    }

    disconnectedCallback() {
        window.removeEventListener("beforeinstallprompt", this.alInstalar);
        window.removeEventListener("appinstalled", this.alInstalada);
    }

    actualizarEstado() {
        const disponible = !!instalacionPendienteGlobal;
        if (this.botonInstalar) this.botonInstalar.disabled = !disponible;
        if (this.nota) this.nota.hidden = disponible;
    }

    mostrar() {
        if (this.instalada()) return;
        this.actualizarEstado();
        if (this.aviso) this.aviso.hidden = false;
    }

    ocultar() {
        if (this.aviso) this.aviso.hidden = true;
    }
}
customElements.define("aviso-instalar-app", AvisoInstalarApp);
export default AvisoInstalarApp;
