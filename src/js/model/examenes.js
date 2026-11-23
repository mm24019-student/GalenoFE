export function indicacionesExamen(examen) {
    let id = examen && examen.idExamen ? examen.idExamen : "sin-id";
    let nombre = examen && examen.nombre ? examen.nombre : "Examen";
    return "Examen|" + id + "|" + nombre;
}

export function examenDeIndicaciones(texto) {
    let partes = String(texto || "").split("|");
    if (partes[0] === "Examen" && partes.length >= 3) {
        return { idExamen: partes[1], nombre: partes.slice(2).join("|") };
    }
    return { idExamen: null, nombre: String(texto || "Examen") };
}

export function textoResultado(valor, porDefecto = "pendiente") {
    let texto = String(valor == null ? "" : valor).trim();
    return texto.length >= 3 ? texto : porDefecto;
}
