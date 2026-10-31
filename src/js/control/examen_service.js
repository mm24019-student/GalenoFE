import DefaultService from './default_service.js';

class ExamenService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "examen";
    }
}
export default ExamenService;