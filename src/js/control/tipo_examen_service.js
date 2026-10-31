import DefaultService from './default_service.js';

class TipoExamenService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "tipoexamen";
    }
}
export default TipoExamenService;