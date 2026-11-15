class DefaultError {
    constructor(){
        this.mensaje="";
        this.error=null;
        this.estado=null;   // codigo HTTP cuando el servidor rechazo la peticion
        this.detalle="";    // explicacion en lenguaje claro de por que fallo
    }

    // Las pantallas leen error.message (igual que en Error): muestra el detalle si existe
    get message() {
        return this.detalle || this.mensaje;
    }

    toString() {
        return this.message;
    }
}
export default DefaultError;
