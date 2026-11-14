/**
 * Ordena los pasos de un procedimiento usando la tabla de secuencias y,
 * cuando no hay secuencias, por nombre. Tambien calcula el paso actual y sus
 * vecinos para avanzar/retroceder en la atencion.
 */
function idDePaso(paso) {
    if (!paso) {
        return null;
    }
    return paso.idProcedimientoPaso || (paso.idProcedimientoPaso && paso.idProcedimientoPaso.idProcedimientoPaso) || null;
}

function idDePasoConsulta(paso) {
    if (!paso) {
        return null;
    }
    let definicion = paso.idProcedimientoPaso;
    return definicion && definicion.idProcedimientoPaso
        ? definicion.idProcedimientoPaso
        : (paso.idProcedimientoPaso || null);
}

function idDeSecuencia(valor) {
    if (!valor) {
        return null;
    }
    if (typeof valor === "string") {
        return valor;
    }
    return valor.idProcedimientoPaso || null;
}

export function ordenarPasos(definiciones, secuencias) {
    let pasos = (definiciones || []).filter(Boolean);
    let porId = new Map();
    pasos.forEach(p => {
        let id = idDePaso(p);
        if (id) {
            porId.set(id, p);
        }
    });

    let aristas = new Map();
    let conPredecesor = new Set();
    (secuencias || []).forEach(s => {
        let destino = idDeSecuencia(s.idProcedimientoPaso);
        let origen = idDeSecuencia(s.idProcedimientoPasoReferencia);
        if (!origen || !destino || !porId.has(origen) || !porId.has(destino)) {
            return;
        }
        conPredecesor.add(destino);
        if (!aristas.has(origen)) {
            aristas.set(origen, []);
        }
        aristas.get(origen).push(destino);
    });

    let raices = pasos
        .map(idDePaso)
        .filter(id => id && !conPredecesor.has(id))
        .sort((a, b) => nombreDe(porId.get(a)).localeCompare(nombreDe(porId.get(b)), "es"));

    if (raices.length === 0) {
        raices = pasos.map(idDePaso).filter(Boolean)
            .sort((a, b) => nombreDe(porId.get(a)).localeCompare(nombreDe(porId.get(b)), "es"));
    }

    let orden = [];
    let visitados = new Set();
    function visitar(id) {
        if (visitados.has(id) || !porId.has(id)) {
            return;
        }
        visitados.add(id);
        orden.push(porId.get(id));
        (aristas.get(id) || [])
            .sort((a, b) => nombreDe(porId.get(a)).localeCompare(nombreDe(porId.get(b)), "es"))
            .forEach(visitar);
    }
    raices.forEach(visitar);
    pasos.forEach(p => {
        let id = idDePaso(p);
        if (!visitados.has(id)) {
            visitados.add(id);
            orden.push(p);
        }
    });
    return orden;
}

function nombreDe(paso) {
    return paso && paso.nombre ? String(paso.nombre) : "";
}

/**
 * Devuelve el indice del primer paso de la consulta que aun no esta completado
 * ni cancelado. Si ya terminaron todos, devuelve el ultimo.
 */
export function indicePasoActual(pasosConsulta, orden) {
    let pasos = (pasosConsulta || []).slice();
    let posiciones = new Map();
    (orden || []).forEach((definicion, indice) => {
        posiciones.set(idDePaso(definicion), indice);
    });
    pasos.sort((a, b) => {
        let ia = posiciones.has(idDePasoConsulta(a)) ? posiciones.get(idDePasoConsulta(a)) : 999;
        let ib = posiciones.has(idDePasoConsulta(b)) ? posiciones.get(idDePasoConsulta(b)) : 999;
        return ia - ib;
    });
    let indice = pasos.findIndex(p => {
        let estado = String(p.estado || "").toUpperCase();
        return estado !== "COMPLETADO" && estado !== "CANCELADO";
    });
    return indice >= 0 ? indice : Math.max(0, pasos.length - 1);
}

export function pasosOrdenados(pasosConsulta, orden) {
    let posiciones = new Map();
    (orden || []).forEach((definicion, indice) => {
        posiciones.set(idDePaso(definicion), indice);
    });
    return (pasosConsulta || []).slice().sort((a, b) => {
        let ia = posiciones.has(idDePasoConsulta(a)) ? posiciones.get(idDePasoConsulta(a)) : 999;
        let ib = posiciones.has(idDePasoConsulta(b)) ? posiciones.get(idDePasoConsulta(b)) : 999;
        return ia - ib;
    });
}

export { idDePaso, idDePasoConsulta };
