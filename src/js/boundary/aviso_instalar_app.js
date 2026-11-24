const plantilla = document.createElement("template");
plantilla.innerHTML = `
    <link rel="stylesheet" href="recursos/estilos/componentes/aviso_instalar_app.css">
    <div class="aviso-instalar" part="aviso-instalar" role="dialog" aria-modal="true" aria-label="Instalar aplicación" hidden>
        <section class="aviso-instalar__panel">
            <p class="aviso-instalar__titulo">Instalar aplicación</p>
            <p class="aviso-instalar__texto">¿Quieres estar al pendiente de tus citas? Descarga la app</p>
            <p class="aviso-instalar__nota" hidden>La instalación no está disponible en este momento. Recarga la página o usa la opción “Instalar app” del navegador.</p>
            <div class="aviso-instalar__acciones">
                <button type="button" class="aviso-instalar__cerrar secundario" aria-label="Cerrar aviso">Cancelar</button>
                <button type="button" class="aviso-instalar__ver secundario">Solo ver PDF en línea</button>
                <button type="button" class="aviso-instalar__instalar">Instalar</button>
            </div>
        </section>
    </div>
`;

const CLAVE_INSTALADA = "galeno-app-instalada";
const EVENTO_CAMBIO = "galeno-instalacion-cambiada";

let promptDiferido = null;
let promptDisponible = false;
let canceladoEnEstaPagina = false;

function leerMarca() {
    try {
        return localStorage.getItem(CLAVE_INSTALADA) === "1";
    } catch (e) {
        return false;
    }
}

function marcarInstalada() {
    try {
        localStorage.setItem(CLAVE_INSTALADA, "1");
    } catch (e) {
    }
}

function limpiarMarca() {
    try {
        localStorage.removeItem(CLAVE_INSTALADA);
    } catch (e) {
    }
}

function enModoApp() {
    return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
        || window.navigator.standalone === true;
}

function estaInstalada() {
    return enModoApp() || (leerMarca() && !promptDisponible);
}

window.addEventListener("beforeinstallprompt", (evento) => {
    evento.preventDefault();
    promptDiferido = evento;
    promptDisponible = true;
    limpiarMarca();
    window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO));
});

window.addEventListener("appinstalled", () => {
    promptDiferido = null;
    promptDisponible = false;
    marcarInstalada();
    window.dispatchEvent(new CustomEvent(EVENTO_CAMBIO));
});

class AvisoInstalarApp extends HTMLElement {

    constructor() {
        super();
        this.root = this.attachShadow({ mode: "open" });
        this.root.appendChild(plantilla.content.cloneNode(true));
        this.aviso = this.root.querySelector(".aviso-instalar");
        this.botonInstalar = this.root.querySelector(".aviso-instalar__instalar");
        this.botonVerLinea = this.root.querySelector(".aviso-instalar__ver");
        this.nota = this.root.querySelector(".aviso-instalar__nota");
        this.alCambio = () => this.actualizarEstado();
        this.alVerPdf = null;
        this.root.querySelector(".aviso-instalar__cerrar").addEventListener("click", () => {
            canceladoEnEstaPagina = true;
            this.alVerPdf = null;
            this.ocultar();
        });
        this.botonVerLinea.addEventListener("click", () => {
            let accion = this.alVerPdf;
            this.alVerPdf = null;
            this.ocultar();
            if (accion) {
                accion();
            }
        });
        this.botonInstalar.addEventListener("click", async () => {
            if (!promptDiferido) {
                this.actualizarEstado();
                return;
            }
            const pendiente = promptDiferido;
            promptDiferido = null;
            promptDisponible = false;
            pendiente.prompt();
            const eleccion = await pendiente.userChoice;
            if (eleccion && eleccion.outcome === "accepted") {
                marcarInstalada();
            }
            this.alVerPdf = null;
            this.actualizarEstado();
            this.ocultar();
        });
    }

    connectedCallback() {
        window.addEventListener(EVENTO_CAMBIO, this.alCambio);
        this.actualizarEstado();
        if (estaInstalada()) {
            this.ocultar();
        }
    }

    disconnectedCallback() {
        window.removeEventListener(EVENTO_CAMBIO, this.alCambio);
    }

    actualizarEstado() {
        const disponible = !!promptDiferido;
        if (this.botonInstalar) this.botonInstalar.disabled = !disponible;
        if (this.nota) this.nota.hidden = disponible;
        if (estaInstalada()) this.ocultar();
    }

    abrirModal(alVerPdf) {
        canceladoEnEstaPagina = false;
        this.alVerPdf = typeof alVerPdf === "function" ? alVerPdf : null;
        this.mostrar();
    }

    mostrar() {
        if (canceladoEnEstaPagina) return;
        if (estaInstalada()) return;
        this.actualizarEstado();
        if (this.aviso) this.aviso.hidden = false;
    }

    ocultar() {
        if (this.aviso) this.aviso.hidden = true;
    }
}
customElements.define("aviso-instalar-app", AvisoInstalarApp);
export default AvisoInstalarApp;
