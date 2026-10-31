import DefaultService from './default_service.js';

class ProcedimientoPasoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "procedimientopaso";
    }

    porProcedimiento(id) {
        return this.findBy(`${this.URL}/procedimiento/${id}`);
    }
}
export default ProcedimientoPasoService;