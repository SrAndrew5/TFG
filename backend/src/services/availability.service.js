const prisma = require('../config/database');

/**
 * Calcula los slots disponibles para un empleado en una fecha dada
 * @param {number} empleadoId
 * @param {string} fecha - "YYYY-MM-DD"
 * @param {number} duracionMin - Duración del servicio en minutos
 * @returns {Array<{hora_inicio: string, hora_fin: string}>}
 */
async function getAvailableSlots(empleadoId, fecha, duracionMin) {
  const date = new Date(fecha);
  // JavaScript: 0=Sunday, 1=Monday, ... → Convertir a nuestro formato: 0=Monday
  let diaSemana = date.getDay() - 1;
  if (diaSemana < 0) diaSemana = 6; // Sunday = 6

  // 1. Obtener horarios del empleado para ese día
  const disponibilidades = await prisma.disponibilidad.findMany({
    where: {
      empleado_id: empleadoId,
      dia_semana: diaSemana,
    },
    orderBy: { hora_inicio: 'asc' },
  });

  if (disponibilidades.length === 0) return [];

  // 2. Obtener citas existentes del empleado en esa fecha
  const citasExistentes = await prisma.cita.findMany({
    where: {
      empleado_id: empleadoId,
      fecha: date,
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
    },
    orderBy: { hora_inicio: 'asc' },
  });

  // 3. Generar todos los slots posibles
  const slots = [];
  const slotInterval = 15; // Intervalos de 15 minutos

  for (const disp of disponibilidades) {
    let currentMinutes = timeToMinutes(disp.hora_inicio);
    const endMinutes = timeToMinutes(disp.hora_fin);

    while (currentMinutes + duracionMin <= endMinutes) {
      const slotStart = minutesToTime(currentMinutes);
      const slotEnd = minutesToTime(currentMinutes + duracionMin);

      // Verificar que no colisiona con citas existentes
      const hasConflict = citasExistentes.some((cita) => {
        const citaStart = timeToMinutes(cita.hora_inicio);
        const citaEnd = timeToMinutes(cita.hora_fin);
        return currentMinutes < citaEnd && currentMinutes + duracionMin > citaStart;
      });

      if (!hasConflict) {
        slots.push({ hora_inicio: slotStart, hora_fin: slotEnd });
      }

      currentMinutes += slotInterval;
    }
  }

  return slots;
}

/**
 * Verifica si un recurso de coworking está disponible en un rango horario
 */
async function isResourceAvailable(recursoId, fecha, horaInicio, horaFin) {
  const date = new Date(fecha);
  const startMin = timeToMinutes(horaInicio);
  const endMin = timeToMinutes(horaFin);

  const reservasExistentes = await prisma.reservaRecurso.findMany({
    where: {
      recurso_id: recursoId,
      fecha: date,
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
    },
  });

  return !reservasExistentes.some((reserva) => {
    const rStart = timeToMinutes(reserva.hora_inicio);
    const rEnd = timeToMinutes(reserva.hora_fin);
    return startMin < rEnd && endMin > rStart;
  });
}

/**
 * Obtiene los horarios ocupados de un recurso en una fecha
 */
async function getResourceOccupiedSlots(recursoId, fecha) {
  const date = new Date(fecha);
  return prisma.reservaRecurso.findMany({
    where: {
      recurso_id: recursoId,
      fecha: date,
      estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
    },
    select: {
      hora_inicio: true,
      hora_fin: true,
      estado: true,
    },
    orderBy: { hora_inicio: 'asc' },
  });
}

// --- Helpers ---

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

module.exports = {
  getAvailableSlots,
  isResourceAvailable,
  getResourceOccupiedSlots,
  timeToMinutes,
  minutesToTime,
};
