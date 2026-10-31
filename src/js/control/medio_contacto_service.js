import DefaultService from './default_service.js';

class MedioContactoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "mediocontacto";
    }

    porPersona(id) {
        return this.findBy(`${this.URL}/persona/${id}`);
    }
}
export default MedioContactoService;