import DefaultService from './default_service.js';

class ConsultaProcedimientoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "consultaprocedimiento";
    }

    porConsulta(id) {
        return this.findBy(`${this.URL}/consulta/${id}`);
    }
}
export default ConsultaProcedimientoService;
