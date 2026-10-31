import DefaultService from './default_service.js';

class ProcedimientoPasoExamenService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "procedimientopasoexamen";
    }

    porProcedimientoPaso(id) {
        return this.findBy(`${this.URL}/procedimientopaso/${id}`);
    }
}
export default ProcedimientoPasoExamenService;