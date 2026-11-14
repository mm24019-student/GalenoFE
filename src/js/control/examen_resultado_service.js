import DefaultService from './default_service.js';

class ExamenResultadoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "examenresultado";
    }

    porOrdenExamen(id) {
        return this.findBy(`${this.URL}/ordenexamen/${id}`);
    }
}
export default ExamenResultadoService;
