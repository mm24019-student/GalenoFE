import DocumentoService from "./documento_service.js";
import PersonaRolService from "./persona_rol_service.js";

/**
 * Resuelve la identidad de una persona con su tipo y numero de documento.
 * Devuelve { persona, documento, asignaciones } o lanza un Error con un
 * mensaje apto para mostrar al usuario.
 */
export function buscarIdentidad(tipoDocumento, valorDocumento) {
    let tipo = String(tipoDocumento || "").trim();
    let valor = String(valorDocumento || "").trim();
    if (!tipo) {
        return Promise.reject(new Error("Seleccione el tipo de documento."));
    }
    if (!valor) {
        return Promise.reject(new Error("Escriba el número de documento."));
    }
    let documentos = new DocumentoService();
    let personaRol = new PersonaRolService();
    return documentos.buscar(valor, tipo).then(resp => {
        let documento = (resp.datos || []).find(d => d.idPersona);
        if (!documento || !documento.idPersona || !documento.idPersona.idPersona) {
            throw new Error("No se encontró una persona con ese documento.");
        }
        let persona = documento.idPersona;
        return personaRol.porPersona(persona.idPersona).then(asignaciones => {
            return {
                persona: persona,
                documento: documento,
                asignaciones: asignaciones.datos || []
            };
        });
    });
}
