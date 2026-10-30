import DefaultError from '../entity/default_error.js';
import DefaultResponse from '../entity/default_response.js';

class DefaultService {
    constructor() {
        this.BASE_URL = "http://localhost:9080/GalenoSV-1.0-SNAPSHOT/resources/";
        this.URL = this.BASE_URL;
    }

    findRange(first, max) {
        let salida = new Promise((resolve, reject) => {
            fetch(`${this.URL}?first=${first}&max=${max}`, { method: "GET" }).then(r => {
                if (r.status === 200) {
                    r.json().then(j => {
                        let response = new DefaultResponse();
                        response.datos = j;
                        response.totalDatos = r.headers.get("Total-registros");
                        resolve(response);
                    }).catch(e => {
                        let error = new DefaultError();
                        error.mensaje = "Error al parsear la respuesta del servidor";
                        error.error = e;
                        reject(error);
                    });
                } else {
                    let error = new DefaultError();
                    error.mensaje = `Error al obtener los datos: ${r.status}`;
                    reject(error);
                }
            }).catch(e => {
                let error = new DefaultError();
                error.mensaje = "Error al acceder al repositorio";
                error.error = e;
                reject(error);
            });
        });
        return salida;
    }
}
export default DefaultService;