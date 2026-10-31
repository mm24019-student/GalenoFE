import DefaultService from './default_service.js';

class ExamenTipoExamenService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "examentipoexamen";
    }

    porExamen(id) {
        return this.findBy(`${this.URL}/examen/${id}`);
    }
}
export default ExamenTipoExamenService;