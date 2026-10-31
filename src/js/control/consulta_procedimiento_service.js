import DefaultService from './default_service.js';

class ConsultaService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "consulta";
    }
}
export default ConsultaService;