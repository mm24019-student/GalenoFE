import DefaultService from './default_service.js';

class ProcedimientoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "procedimiento";
    }
}
export default ProcedimientoService;