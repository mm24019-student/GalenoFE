import DefaultService from './default_service.js';

class OrdenExamenService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "ordenexamen";
    }

    porConsultaProcedimientoPaso(id) {
        return this.findBy(`${this.URL}/consultaprocedimientopaso/${id}`);
    }
}
export default OrdenExamenService;
