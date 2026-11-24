import { MENSAJE_ESTADO_BACKEND, MENSAJE_CONFIGURAR_API, URL_API } from "../model/config.js";

class Conectividad extends EventTarget {

    constructor() {
        super();
        this.conectado = true;
        this.urlApi = URL_API;
        this.iniciado = false;
        this.alMensaje = evento => {
            let datos = evento.data;
            if (datos && datos.tipo === MENSAJE_ESTADO_BACKEND
                    && typeof datos.conectado === "boolean") {
                this.marcar(datos.conectado);
            }
        };
        this.alConectar = () => this.verificar();
        this.alDesconectar = () => this.marcar(false);
    }

    iniciar() {
        if (this.iniciado) {
            return this.verificar();
        }
        this.iniciado = true;
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.addEventListener("message", this.alMensaje);
        }
        window.addEventListener("online", this.alConectar);
        window.addEventListener("offline", this.alDesconectar);
        return this.verificar();
    }

    configurarApi(url) {
        if (typeof url === "string" && url.trim()) {
            this.urlApi = url.trim().replace(/\/+$/, "") + "/";
            if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    tipo: MENSAJE_CONFIGURAR_API,
                    url: this.urlApi
                });
            }
        }
    }

    verificar() {
        return this.peticion(`${this.urlApi}salud`, { method: "GET", cache: "no-store" })
            .then(() => {
                this.marcar(true);
                return true;
            })
            .catch(() => {
                this.marcar(false);
                return false;
            });
    }

    peticion(url, opciones) {
        return fetch(url, opciones).then(respuesta => {
            this.notificarRespuesta(respuesta);
            return respuesta;
        }).catch(error => {
            this.notificarFallo();
            throw error;
        });
    }

    notificarRespuesta(respuesta) {
        if (respuesta) {
            this.marcar(true);
        }
    }

    notificarFallo() {
        this.marcar(false);
    }

    marcar(valor) {
        let conectado = Boolean(valor);
        if (this.conectado === conectado) {
            return;
        }
        this.conectado = conectado;
        this.dispatchEvent(new CustomEvent("cambio", { detail: { conectado: conectado } }));
    }
}

export const conectividad = new Conectividad();
export default conectividad;
