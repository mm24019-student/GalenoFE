import DefaultService from './default_service.js';
import DefaultResponse from '../entity/default_response.js';

class ConsultaProcedimientoPasoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "consultaprocedimientopaso";
    }

    porConsultaProcedimiento(id) {
        return this.findBy(`${this.URL}/consultaprocedimiento/${id}`);
    }

    accion(id, nombre) {
        return new Promise((resolve, reject) => {
            fetch(`${this.URL}/${id}/${nombre}`, { method: "POST" }).then(r => {
                if (r.status === 200) {
                    r.json().then(j => {
                        let response = new DefaultResponse();
                        response.datos = j;
                        response.totalDatos = 1;
                        resolve(response);
                    }).catch(e => {
                        reject(this.crearError("No se pudo interpretar la respuesta del servidor", e, null,
                            this.detalleRespuestaInvalida("No se pudo ejecutar la acción")));
                    });
                } else {
                    this.rechazarRespuesta(r, reject, "No se pudo ejecutar la acción");
                }
            }).catch(e => {
                reject(this.crearError("Error al acceder al repositorio", e, null,
                    this.detalleSinConexion("No se pudo ejecutar la acción")));
            });
        });
    }

    avanzar(id) {
        return this.accion(id, "avanzar");
    }

    retroceder(id) {
        return this.accion(id, "retroceder");
    }
}
export default ConsultaProcedimientoPasoService;
