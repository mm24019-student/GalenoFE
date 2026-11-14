import DefaultService from './default_service.js';

class ConsultaProcedimientoPasoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "consultaprocedimientopaso";
    }

    porConsultaProcedimiento(id) {
        return this.findBy(`${this.URL}/consultaprocedimiento/${id}`);
    }
}
export default ConsultaProcedimientoPasoService;
