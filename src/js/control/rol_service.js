import DefaultService from './default_service.js';

class RolService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "rol";
    }
}
export default RolService;