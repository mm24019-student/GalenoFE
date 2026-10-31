import DefaultService from './default_service.js';

class PersonaService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "persona";
    }
}
export default PersonaService;