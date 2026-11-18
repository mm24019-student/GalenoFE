import { nuevoId } from "./ids.js";
import { ahoraISO } from "./fechas.js";

export function idRolDeDefinicion(definicion) {
    return definicion && definicion.idRol ? definicion.idRol.idRol : null;
}

/**
 * Busca la asignación de empleado que puede atender un paso: primero la que
 * coincide con la clínica y el rol del paso; si no existe, la del rol aunque
 * sea de otra clínica; y por último la primera asignación de la clínica.
 */
export function asignacionPara(definicion, asignaciones, clinica) {
    let idClinica = clinica ? clinica.idClinica : null;
    let idRol = idRolDeDefinicion(definicion);
    let lista = (asignaciones || []).filter(a => a && (a.rol || a.clinica));
    let porClinica = lista.filter(a => !idClinica || (a.clinica && a.clinica.idClinica === idClinica));
    let exacta = porClinica.find(a => a.rol && a.rol.idRol === idRol);
    if (exacta) {
        return exacta;
    }
    let porRol = lista.find(a => a && a.rol && a.rol.idRol === idRol);
    if (porRol) {
        return porRol;
    }
    return porClinica[0] || lista.find(Boolean) || null;
}

export function nuevoPaso({ idConsultaProcedimiento, definicion, asignacion, fecha } = {}) {
    return {
        idConsultaProcedimientoPaso: nuevoId(),
        fechaInicio: fecha || ahoraISO(),
        fechaFin: null,
        estado: "PENDIENTE",
        valor: "",
        idConsultaProcedimiento: { idConsultaProcedimiento: idConsultaProcedimiento },
        idProcedimientoPaso: definicion && definicion.idProcedimientoPaso
            ? { idProcedimientoPaso: definicion.idProcedimientoPaso } : null,
        idPersonaRol: asignacion && asignacion.idPersonaRol
            ? { idPersonaRol: asignacion.idPersonaRol } : null
    };
}

export function textoIndicaciones(nombres) {
    let lista = (nombres || []).filter(Boolean);
    return lista.length === 0 ? "" : "Exámenes administrados: " + lista.join(", ");
}
