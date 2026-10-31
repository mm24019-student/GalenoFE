import DefaultService from './default_service.js';

class ExamenResultadoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "examenresultado";
    }
}
export default ExamenResultadoService;