/**
 * dateUtils.js — Helpers centralizados de parsing de fechas
 *
 * Problema resuelto: el endpoint /api/admin/* devuelve fechas en formato ISO
 * completo ("2026-05-09T00:00:00.000Z"), mientras que el endpoint de cliente
 * devuelve "2026-05-09". Ambos formatos deben producir la misma Date local
 * sin desfase de zona horaria (por eso NO se usa `new Date(str)` directamente
 * con formato YYYY-MM-DD, que en algunos navegadores lo interpreta como UTC).
 */

/**
 * Convierte una fecha del backend a un objeto Date local sin desfase UTC.
 * Acepta:
 *   - "2026-05-09"                  → Date(2026, 4, 9)   ✅
 *   - "2026-05-09T00:00:00.000Z"    → Date(2026, 4, 9)   ✅
 *   - null / undefined              → Date actual         ✅
 *
 * @param {string|null|undefined} fecha
 * @returns {Date}
 */
export function parseDate(fecha) {
  if (!fecha) return new Date();
  // Tomar solo los primeros 10 caracteres ("YYYY-MM-DD") independientemente
  // de si la cadena es un ISO completo o ya viene recortada.
  const str = typeof fecha === 'string' ? fecha.slice(0, 10) : '';
  const [y, m, d] = str.split('-').map(Number);
  // Si el parsing fue exitoso, construir Date con constructor local (sin UTC)
  return y ? new Date(y, m - 1, d) : new Date(fecha);
}

/**
 * Formatea una fecha del backend como cadena localizada en español.
 * Ejemplo: "2026-05-09T00:00:00.000Z" → "09/05/2026"
 *
 * @param {string|null|undefined} fecha
 * @param {Intl.DateTimeFormatOptions} [opts] — opciones de formato adicionales
 * @returns {string}
 */
export function formatDate(fecha, opts = {}) {
  const date = parseDate(fecha);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...opts,
  });
}

/**
 * Formatea una fecha con nombre del día y mes largo.
 * Ejemplo: "2026-05-09T00:00:00.000Z" → "sáb., 9 de mayo de 2026"
 *
 * @param {string|null|undefined} fecha
 * @returns {string}
 */
export function formatDateLong(fecha) {
  return formatDate(fecha, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'short',
  });
}
/**
 * Formatea una fecha relativa (Hoy, Mañana, Ayer) o la fecha corta.
 * Ejemplo: "2026-05-09", "10:00" → "Hoy, 10:00"
 *
 * @param {string} fecha 
 * @param {string} [timeString] 
 * @returns {string}
 */
export function formatRelativeDate(fecha, timeString) {
  if (!fecha) return '';
  
  const dateObj = parseDate(fecha);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isSameDay = (d1, d2) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let label = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  
  if (isSameDay(dateObj, today)) {
    label = 'Hoy';
  } else if (isSameDay(dateObj, yesterday)) {
    label = 'Ayer';
  } else if (isSameDay(dateObj, tomorrow)) {
    label = 'Mañana';
  }

  return timeString ? `${label}, ${timeString}` : label;
}
