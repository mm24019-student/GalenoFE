import PaginaBase from "./pagina_base.js";

class PaginaNoEncontrada extends PaginaBase {

    get titulo() {
        return "Página no encontrada";
    }

    get historia() {
        return "";
    }
}
customElements.define("pagina-no-encontrada", PaginaNoEncontrada);
export default PaginaNoEncontrada;