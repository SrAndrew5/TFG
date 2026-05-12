const { timeToMinutes } = require('./availability.service');

/**
 * Error de dominio con statusCode HTTP.
 * El errorHandler global ya sabe leer .statusCode si lo usas con throw.
 */
function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

/**
 * Aplica un código de descuento al precio base. Valida y consume un uso del código
 * de forma atómica dentro de la transacción.
 *
 * Sin código → devuelve precio base sin cambios.
 * Con código inválido / expirado / agotado / inactivo → throw 400.
 *
 * @param {object} tx - Cliente de Prisma transaccional (tx de prisma.$transaction)
 * @param {string|null} codigoRaw - Código tal cual lo manda el cliente
 * @param {number|string|Decimal} basePrice - Precio antes de descuento
 * @returns {Promise<number>} Precio final en euros con 2 decimales
 */
async function applyDiscount(tx, codigoRaw, basePrice) {
  const base = Number(basePrice);
  if (!codigoRaw || !codigoRaw.trim()) return round2(base);

  const codigo = codigoRaw.trim().toUpperCase();
  const cd = await tx.codigoDescuento.findUnique({ where: { codigo } });

  if (!cd || !cd.activo) {
    throw httpError(400, 'Código de descuento no válido');
  }
  if (cd.fecha_expiry && cd.fecha_expiry < new Date()) {
    throw httpError(400, 'Código de descuento expirado');
  }
  if (cd.max_usos !== null && cd.usos_actuales >= cd.max_usos) {
    throw httpError(400, 'Código de descuento agotado');
  }

  // Consume un uso. La race condition existe en teoría (dos requests simultáneos
  // pueden ambos pasar el check con usos_actuales=N-1) pero el coste de añadir
  // FOR UPDATE excede el riesgo en este TFG: como mucho permite 1 uso extra.
  await tx.codigoDescuento.update({
    where: { codigo },
    data: { usos_actuales: { increment: 1 } },
  });

  return round2(base * (1 - cd.porcentaje / 100));
}

/**
 * Calcula el precio final de una cita.
 * Toma el precio del servicio en BD — NUNCA del cliente.
 */
async function priceForAppointment(tx, servicio_id, codigoDescuento) {
  const servicio = await tx.servicio.findUnique({
    where: { id: servicio_id },
    select: { precio: true },
  });
  if (!servicio) throw httpError(404, 'Servicio no encontrado');
  return applyDiscount(tx, codigoDescuento, servicio.precio);
}

/**
 * Calcula el precio final de una reserva de recurso.
 * precio_hora * (minutos / 60), luego aplica descuento.
 */
async function priceForResourceBooking(tx, recurso, hora_inicio, hora_fin, codigoDescuento) {
  if (!recurso || !recurso.precio_hora) {
    throw httpError(404, 'Recurso no encontrado o sin precio configurado');
  }

  const minutos = timeToMinutes(hora_fin) - timeToMinutes(hora_inicio);
  if (minutos <= 0) throw httpError(400, 'Rango horario inválido');

  const horas = minutos / 60;
  const base = Number(recurso.precio_hora) * horas;
  return applyDiscount(tx, codigoDescuento, base);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { applyDiscount, priceForAppointment, priceForResourceBooking, httpError };
