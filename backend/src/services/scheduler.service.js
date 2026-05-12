const cron = require('node-cron');
const prisma = require('../config/database');
const logger = require('../config/logger');

/**
 * Pide al usuario que reseñe su espacio entre 1 y 6 horas tras finalizar la reserva.
 * Genera una `Notification` de tipo `review` por cada reserva elegible,
 * y marca `review_request_sent_at` para no duplicar.
 */
async function runReviewRequestJob() {
  logger.info('Ejecutando cron: solicitudes de reseña post-reserva');

  const now = new Date();
  const minDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const maxDate = new Date(now.getTime() - 1 * 60 * 60 * 1000);

  try {
    const reservas = await prisma.reservaRecurso.findMany({
      where: {
        review_request_sent_at: null,
        estado: { in: ['CONFIRMADA', 'COMPLETADA'] },
        fecha: { gte: new Date(minDate.toISOString().split('T')[0]) },
      },
      include: {
        recurso: { select: { nombre: true } },
        review:  { select: { id: true } },
      },
      take: 500,
    });

    let sent = 0;
    for (const r of reservas) {
      if (r.review) continue;
      const finIso = combineDateAndTime(r.fecha, r.hora_fin);
      if (!finIso || finIso < minDate || finIso > maxDate) continue;

      await prisma.$transaction([
        prisma.notification.create({
          data: {
            usuario_id: r.usuario_id,
            type: 'review',
            title: '¿Cómo fue tu experiencia?',
            body: `Cuéntanos qué te pareció ${r.recurso.nombre}. Tu opinión ayuda a otros usuarios.`,
          },
        }),
        prisma.reservaRecurso.update({
          where: { id: r.id },
          data: { review_request_sent_at: now },
        }),
      ]);
      sent += 1;
    }

    logger.info({ sent }, 'Solicitudes de reseña enviadas');
  } catch (err) {
    logger.error({ err }, 'Error en cron de solicitudes de reseña');
  }
}

/**
 * Combina un Date (YYYY-MM-DD) con un HH:MM en UTC. Devuelve null si los valores
 * son inválidos. Usa la TZ configurada de Node (process.env.TZ → Europe/Madrid)
 * para que las comparaciones sean coherentes con la hora local mostrada al usuario.
 */
function combineDateAndTime(dateValue, timeStr) {
  if (!dateValue || !timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return null;
  const [hh, mm] = timeStr.split(':').map(Number);
  const d = new Date(dateValue);
  d.setHours(hh, mm, 0, 0);
  return d;
}

/**
 * Borra tokens caducados de las tablas de soporte. Sin esto, las tablas crecen
 * indefinidamente con tokens ya inservibles (expiración 1h reset, 24h verificación).
 */
async function runTokenCleanupJob() {
  logger.info('Ejecutando cron: limpieza de tokens expirados');
  try {
    const now = new Date();

    const [pwd, ver] = await Promise.all([
      prisma.passwordResetToken.deleteMany({ where: { expira_at: { lt: now } } }),
      prisma.emailVerificationToken.deleteMany({ where: { expira_at: { lt: now } } }),
    ]);

    logger.info(
      { passwordResetDeleted: pwd.count, emailVerificationDeleted: ver.count },
      'Limpieza de tokens completada',
    );
  } catch (err) {
    logger.error({ err }, 'Error en cron de limpieza de tokens');
  }
}

/**
 * Arranca todos los cron jobs de la aplicación.
 */
function startScheduler() {
  const timezone = process.env.TZ || 'Europe/Madrid';

  // Limpieza de tokens diaria a las 03:00 (off-peak)
  cron.schedule('0 3 * * *', runTokenCleanupJob, { timezone });

  // Solicitudes de reseña cada hora (a y media). Ventana: 1h-6h tras hora_fin.
  cron.schedule('30 * * * *', runReviewRequestJob, { timezone });

  logger.info({ timezone }, 'Scheduler iniciado — limpieza tokens 03:00, reseñas cada hora');
}

module.exports = { startScheduler, runTokenCleanupJob, runReviewRequestJob };
