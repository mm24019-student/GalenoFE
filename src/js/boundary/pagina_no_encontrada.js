import PaginaBase from "./pagina_base.js";

class PaginaNoEncontrada extends PaginaBase {

    get titulo() {
        return "Página no encontrada";
    }

}
customElements.define("pagina-no-encontrada", PaginaNoEncontrada);
export default PaginaNoEncontrada;