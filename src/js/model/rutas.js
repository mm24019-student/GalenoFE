/**
 * Tabla de rutas de la SPA y resolucion del hash. Vive fuera del componente
 * galeno-router para poder probarse sin DOM.
 *   publica: false  ->  solo se puede entrar con la sesion iniciada
 */
export const RUTAS = [
    { ruta: "/busqueda", componente: "pagina-busqueda-citas", titulo: "Búsqueda de citas", publica: true },
    { ruta: "/login", componente: "pagina-login", titulo: "Iniciar sesión", publica: true },
    { ruta: "/dashboard", componente: "pagina-dashboard", titulo: "Dashboard del empleado", publica: false },
    { ruta: "/atencion", componente: "pagina-atencion", titulo: "Atención de consulta", publica: false }
];

export const NO_ENCONTRADA = {
    ruta: "*",
    componente: "pagina-no-encontrada",
    titulo: "Página no encontrada",
    publica: true
};

/**
 * Separa el hash en ruta y parametros:
 *   "#/atencion?id=123" -> { ruta: "/atencion", parametros: URLSearchParams }
 */
export function leerHash(hash) {
    let texto = String(hash || "").replace(/^#/, "");
    let indice = texto.indexOf("?");
    let ruta = indice >= 0 ? texto.slice(0, indice) : texto;
    let consulta = indice >= 0 ? texto.slice(indice + 1) : "";
    return { ruta: ruta, parametros: new URLSearchParams(consulta) };
}

export function construirHash(ruta, parametros) {
    let texto = new URLSearchParams();
    Object.entries(parametros || {}).forEach(([clave, valor]) => {
        if (valor !== null && valor !== undefined && String(valor) !== "") {
            texto.set(clave, String(valor));
        }
    });
    let consulta = texto.toString();
    return "#" + ruta + (consulta ? "?" + consulta : "");
}

/**
 * @return { redirigir } cuando hay que ir a otra ruta, o
 *         { definicion, ruta, parametros } cuando se puede mostrar.
 */
export function resolverRuta(hash, sesionActiva) {
    let { ruta, parametros } = leerHash(hash);
    if (ruta === "" || ruta === "/") {
        return { redirigir: "#/busqueda" };
    }
    let definicion = RUTAS.find(r => r.ruta === ruta);
    if (!definicion) {
        return { definicion: NO_ENCONTRADA, ruta: ruta, parametros: parametros };
    }
    if (!definicion.publica && !sesionActiva) {
        return { redirigir: "#/login" };
    }
    if (definicion.ruta === "/login" && sesionActiva) {
        return { redirigir: "#/dashboard" };
    }
    return { definicion: definicion, ruta: ruta, parametros: parametros };
}
