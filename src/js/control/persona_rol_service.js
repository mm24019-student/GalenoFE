import DefaultService from './default_service.js';

class PersonaRolService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "personarol";
    }
}
export default PersonaRolService;