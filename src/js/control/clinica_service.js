import DefaultService from './default_service.js';

class ClinicaService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "clinica";
    }
}
export default ClinicaService;