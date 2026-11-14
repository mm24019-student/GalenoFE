/**
 * Utilidades de fecha compartidas por las pantallas. Todo el calculo de "hoy"
 * y de los campos <input type="date"> se hace en hora local.
 */
export function formatearFecha(iso) {
    if (!iso) {
        return "—";
    }
    let fecha = new Date(iso);
    if (isNaN(fecha.getTime())) {
        return String(iso);
    }
    return fecha.toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
}

export function formatearSoloFecha(iso) {
    if (!iso) {
        return "—";
    }
    let fecha = new Date(iso);
    if (isNaN(fecha.getTime())) {
        return String(iso);
    }
    return fecha.toLocaleDateString("es", { dateStyle: "long" });
}

export function formatearHora(iso) {
    if (!iso) {
        return "—";
    }
    let fecha = new Date(iso);
    if (isNaN(fecha.getTime())) {
        return "—";
    }
    return fecha.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

function dosDigitos(numero) {
    return String(numero).padStart(2, "0");
}

export function aISO(fecha) {
    return fecha.getFullYear() + "-" + dosDigitos(fecha.getMonth() + 1) + "-" + dosDigitos(fecha.getDate());
}

export function hoyISO() {
    return aISO(new Date());
}

export function sumarDiasISO(iso, dias) {
    let fecha = fechaLocalDesdeISO(iso) || new Date();
    fecha.setDate(fecha.getDate() + Number(dias || 0));
    return aISO(fecha);
}

export function fechaLocalDesdeISO(iso) {
    if (!iso) {
        return null;
    }
    let partes = String(iso).split("-").map(Number);
    if (partes.length !== 3 || partes.some(n => isNaN(n))) {
        return null;
    }
    return new Date(partes[0], partes[1] - 1, partes[2], 12, 0, 0);
}

export function esHoy(iso) {
    if (!iso) {
        return false;
    }
    let fecha = new Date(iso);
    if (isNaN(fecha.getTime())) {
        return false;
    }
    return aISO(fecha) === hoyISO();
}
