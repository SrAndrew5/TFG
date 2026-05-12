const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Crea una entrada en audit_logs.
 * Se llama manualmente en los controllers después de operaciones importantes.
 *
 * @param {Object} params
 * @param {number|null} params.usuarioId
 * @param {string} params.accion  - ej. 'CREAR_CITA', 'CANCELAR_RESERVA', 'TOGGLE_USUARIO'
 * @param {string} params.entidad - ej. 'cita', 'reserva_recurso', 'usuario'
 * @param {number|null} params.entidadId
 * @param {Object|null} params.datos - datos relevantes (sin passwords)
 * @param {string|null} params.ip
 */
async function audit({ usuarioId = null, accion, entidad, entidadId = null, datos = null, ip = null }) {
  try {
    await prisma.auditLog.create({
      data: {
        usuario_id: usuarioId,
        accion,
        entidad,
        entidad_id: entidadId,
        datos,
        ip,
      },
    });
  } catch (err) {
    // La auditoría nunca debe bloquear el flujo principal
    logger.error({ err }, 'Error escribiendo audit log');
  }
}

module.exports = { audit };
