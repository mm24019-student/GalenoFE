import DefaultService from './default_service.js';

class OrdenExamenService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "ordenexamen";
    }
}
export default OrdenExamenService;