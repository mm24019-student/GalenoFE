import DefaultService from './default_service.js';

class TipoMedioContactoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "tipomediocontacto";
    }
}
export default TipoMedioContactoService;