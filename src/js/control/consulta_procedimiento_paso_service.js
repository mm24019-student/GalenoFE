import DefaultService from './default_service.js';

class ConsultaProcedimientoPasoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "consultaprocedimientopaso";
    }
}
export default ConsultaProcedimientoPasoService;