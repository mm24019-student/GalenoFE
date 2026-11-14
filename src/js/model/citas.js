/**
 * Reglas de negocio puras de las citas y de las asignaciones de una persona.
 * Se usan tanto en la pantalla publica como en el login y el dashboard.
 */
export function normalizar(texto) {
    return String(texto || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function nombreCompleto(persona) {
    if (!persona) {
        return "Sin paciente";
    }
    return [persona.nombres, persona.apellidos]
        .filter(Boolean).map(s => String(s).trim()).join(" ") || "Sin paciente";
}

export function rolDe(asignacion) {
    if (!asignacion) {
        return null;
    }
    return asignacion.rol || asignacion.idRol || null;
}

export function clinicaDe(asignacion) {
    if (!asignacion) {
        return null;
    }
    return asignacion.clinica || asignacion.idClinica || null;
}

export function nombreRol(asignacion) {
    let rol = rolDe(asignacion);
    return rol ? String(rol.nombre || "") : "";
}

export function nombreClinica(asignacion) {
    let clinica = clinicaDe(asignacion);
    return clinica ? String(clinica.nombre || "") : "";
}

export function esPaciente(asignacion) {
    return normalizar(nombreRol(asignacion)) === "paciente";
}

export function esEmpleado(asignacion) {
    return Boolean(clinicaDe(asignacion)) && !esPaciente(asignacion);
}

export function asignacionesPaciente(asignaciones) {
    return (asignaciones || []).filter(esPaciente);
}

export function asignacionesEmpleado(asignaciones) {
    return (asignaciones || []).filter(esEmpleado);
}

/**
 * Clinicas sin repetir donde la persona tiene el rol de paciente.
 */
export function clinicasDePaciente(asignaciones) {
    let mapa = new Map();
    asignacionesPaciente(asignaciones).forEach(a => {
        let clinica = clinicaDe(a);
        if (clinica && clinica.idClinica) {
            mapa.set(clinica.idClinica, { idClinica: clinica.idClinica, nombre: clinica.nombre || "Clínica" });
        }
    });
    return Array.from(mapa.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/**
 * Clinicas y roles donde la persona es empleada. Se usa en el dashboard.
 */
export function contextosDeEmpleado(asignaciones) {
    let mapa = new Map();
    asignacionesEmpleado(asignaciones).forEach(a => {
        let clinica = clinicaDe(a);
        let rol = rolDe(a);
        if (!clinica || !clinica.idClinica || !rol || !rol.idRol) {
            return;
        }
        let clave = clinica.idClinica + "|" + rol.idRol;
        if (!mapa.has(clave)) {
            mapa.set(clave, {
                clave: clave,
                idPersonaRol: a.idPersonaRol || null,
                clinica: { idClinica: clinica.idClinica, nombre: clinica.nombre || "Clínica" },
                rol: { idRol: rol.idRol, nombre: rol.nombre || "Rol" }
            });
        }
    });
    return Array.from(mapa.values());
}

/**
 * Documentos de una persona en formato "Tipo: valor".
 */
export function documentosDePersona(persona) {
    let lista = persona && persona.documentoList ? persona.documentoList : [];
    return lista.map(d => {
        let tipo = d.idTipoDocumento ? d.idTipoDocumento.nombre : "Documento";
        return tipo + ": " + (d.valor || "");
    });
}

export function buscarCitaPorTexto(citas, texto) {
    let q = normalizar(texto).trim();
    if (!q) {
        return citas || [];
    }
    return (citas || []).filter(c => {
        let pr = c.idPersonaRol || {};
        return normalizar([
            c.referenciaExterna,
            c.observaciones,
            nombreCompleto(pr.idPersona),
            nombreRol(pr),
            nombreClinica(pr)
        ].join(" ")).includes(q);
    });
}
