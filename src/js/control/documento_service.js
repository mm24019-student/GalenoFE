import DefaultService from './default_service.js';

class DocumentoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "documento";
    }

    porPersona(id) {
        return this.findBy(`${this.URL}/persona/${id}`);
    }
}
export default DocumentoService;