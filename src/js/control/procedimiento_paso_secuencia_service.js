import DefaultService from './default_service.js';

class ProcedimientoPasoSecuenciaService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "procedimientopasosecuencia";
    }

    porProcedimientoPaso(id) {
        return this.findBy(`${this.URL}/procedimientopaso/${id}`);
    }

    porProcedimiento(id) {
        return this.findBy(`${this.URL}/procedimiento/${id}`);
    }
}
export default ProcedimientoPasoSecuenciaService;