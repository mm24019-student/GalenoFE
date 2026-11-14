import DefaultService from './default_service.js';

class DocumentoService extends DefaultService {
    constructor() {
        super();
        this.URL = this.BASE_URL + "documento";
    }

    porPersona(id) {
        return this.findBy(`${this.URL}/persona/${id}`);
    }

    buscar(valor, idTipoDocumento) {
        let parametros = new URLSearchParams();
        parametros.set("valor", valor || "");
        if (idTipoDocumento) {
            parametros.set("idTipoDocumento", idTipoDocumento);
        }
        return this.findBy(`${this.URL}/buscar?${parametros.toString()}`);
    }
}
export default DocumentoService;
