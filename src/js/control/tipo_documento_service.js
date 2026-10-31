import DefaultService from './default_service.js';

class TipoDocumentoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "tipodocumento";
    }
}
export default TipoDocumentoService;