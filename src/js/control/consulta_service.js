import DefaultService from './default_service.js';

class ConsultaService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "consulta";
    }

    /**
     * Busca citas por documento, clinica y rango de fechas. Los filtros vacios
     * simplemente no se envian.
     * @param {{tipoDocumento?:string, valorDocumento?:string, idClinica?:string, desde?:string, hasta?:string, max?:number}} filtros
     */
    buscar(filtros) {
        let parametros = new URLSearchParams();
        Object.entries(filtros || {}).forEach(([clave, valor]) => {
            if (valor !== null && valor !== undefined && String(valor).trim() !== "") {
                parametros.set(clave, String(valor).trim());
            }
        });
        parametros.set("max", String((filtros && filtros.max) || 100));
        return this.findBy(`${this.URL}/buscar?${parametros.toString()}`);
    }

    /**
     * URL del comprobante PDF generado por el backend.
     */
    urlTicket(id) {
        return `${this.URL}/${id}/ticket`;
    }

    descargarTicket(id) {
        return fetch(this.urlTicket(id), { method: "GET" }).then(r => {
            if (r.status !== 200) {
                throw new Error("No se pudo generar el comprobante (" + r.status + ")");
            }
            return r.blob();
        });
    }
}
export default ConsultaService;
