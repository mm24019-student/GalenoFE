const CLAVE = "galeno-sesion";

/**
 * Sesion del empleado (HU2). Es reactiva: emite el evento "cambio" cada vez que se modifica,
 * y asi el menu y el router reaccionan sin que nadie los llame.
 * Guarda los datos en sessionStorage para sobrevivir a una recarga de la pagina.
 */
export class Sesion extends EventTarget {

    constructor(almacen = globalThis.sessionStorage) {
        super();
        this.almacen = almacen;
        this.datos = this.leer();
    }

    leer() {
        try {
            let texto = this.almacen ? this.almacen.getItem(CLAVE) : null;
            return texto ? JSON.parse(texto) : null;
        } catch (e) {
            return null;
        }
    }

    guardar() {
        try {
            if (this.datos) {
                this.almacen.setItem(CLAVE, JSON.stringify(this.datos));
            } else {
                this.almacen.removeItem(CLAVE);
            }
        } catch (e) {
            // almacenamiento no disponible: la sesion vive solo en memoria
        }
        this.dispatchEvent(new CustomEvent("cambio"));
    }

    get activa() {
        return this.datos !== null;
    }

    get usuario() {
        return this.datos ? this.datos.usuario : null;
    }

    get asignaciones() {
        return this.datos ? this.datos.asignaciones : [];
    }

    get clinica() {
        return this.datos ? this.datos.clinica : null;
    }

    get rol() {
        return this.datos ? this.datos.rol : null;
    }

    /**
     * @param usuario      la persona que se identifico
     * @param asignaciones lista de { clinica, rol } donde esta registrado como empleado
     */
    iniciar(usuario, asignaciones) {
        this.datos = { usuario: usuario, asignaciones: asignaciones || [], clinica: null, rol: null };
        this.guardar();
    }

    elegirContexto(clinica, rol) {
        if (!this.activa) {
            throw new Error("No hay una sesion iniciada");
        }
        this.datos.clinica = clinica;
        this.datos.rol = rol;
        this.guardar();
    }

    cerrar() {
        this.datos = null;
        this.guardar();
    }
}

export const sesion = new Sesion();