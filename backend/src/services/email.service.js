const nodemailer = require('nodemailer');
const logger = require('../config/logger');

/**
 * Escapa los 5 caracteres significativos en HTML para prevenir inyección XSS
 * en los templates de email. Se aplica a todo campo de texto controlado por el
 * usuario (nombre, apellidos, etc.) antes de interpolarlo en HTML.
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const smtpPort = parseInt(process.env.SMTP_PORT || '1025');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: smtpPort,
  secure: smtpPort === 465,
  // Auth solo si hay credenciales configuradas (producción).
  // En desarrollo con Mailpit no se necesitan.
  ...(process.env.SMTP_USER && process.env.SMTP_PASSWORD
    ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
    : {}),
});

const FROM_ADDRESS = process.env.SMTP_FROM || 'noreply@reservas.local';

/**
 * Enviar email de confirmación de cita
 */
async function sendAppointmentConfirmation(cita, usuario, servicio, empleado) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: usuario.email,
      subject: `✅ Cita confirmada — ${escapeHtml(servicio.nombre)}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Cita Confirmada</h1>
          <p>Hola <strong>${escapeHtml(usuario.nombre)}</strong>,</p>
          <p>Tu cita ha sido confirmada con los siguientes detalles:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Servicio</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${escapeHtml(servicio.nombre)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Profesional</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${escapeHtml(empleado.nombre)} ${escapeHtml(empleado.apellidos)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${cita.fecha}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${cita.hora_inicio} - ${cita.hora_fin}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Precio</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${servicio.precio}€</td></tr>
          </table>
          <p style="color: #6b7280; font-size: 14px;">Si necesitas cancelar o modificar tu cita, hazlo desde la aplicación.</p>
        </div>
      `,
    });
    logger.info({ to: usuario.email }, 'Email de confirmación de cita enviado');
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de confirmación de cita');
    // No lanzamos error — el email no es crítico
  }
}

/**
 * Enviar email de cancelación de cita
 */
async function sendAppointmentCancellation(cita, usuario, servicio) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: usuario.email,
      subject: `❌ Cita cancelada — ${escapeHtml(servicio.nombre)}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Cita Cancelada</h1>
          <p>Hola <strong>${escapeHtml(usuario.nombre)}</strong>,</p>
          <p>Tu cita de <strong>${escapeHtml(servicio.nombre)}</strong> para el día <strong>${cita.fecha}</strong> a las <strong>${cita.hora_inicio}</strong> ha sido cancelada.</p>
          <p>Puedes reservar una nueva cita desde la aplicación.</p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de cancelación');
  }
}

/**
 * Enviar email de confirmación de reserva de recurso
 */
async function sendResourceBookingConfirmation(reserva, usuario, recurso) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: usuario.email,
      subject: `✅ Reserva confirmada — ${escapeHtml(recurso.nombre)}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Reserva Confirmada</h1>
          <p>Hola <strong>${escapeHtml(usuario.nombre)}</strong>,</p>
          <p>Tu reserva ha sido confirmada:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Espacio</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${escapeHtml(recurso.nombre)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Tipo</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${escapeHtml(recurso.tipo)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Ubicación</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${escapeHtml(recurso.ubicacion || 'N/A')}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${reserva.fecha}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Horario</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${reserva.hora_inicio} - ${reserva.hora_fin}</td></tr>
          </table>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de reserva de recurso');
  }
}

/**
 * Enviar email de bienvenida tras registro
 */
async function sendWelcomeEmail(usuario) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: usuario.email,
      subject: '🎉 Bienvenido/a al Sistema de Reservas',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">¡Bienvenido/a!</h1>
          <p>Hola <strong>${escapeHtml(usuario.nombre)}</strong>,</p>
          <p>Tu cuenta ha sido creada exitosamente. Ya puedes empezar a reservar servicios y espacios de coworking.</p>
          <p style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
               style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
              Ir a la aplicación
            </a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de bienvenida');
  }
}

/**
 * Enviar recordatorio de cita (24h antes)
 */
async function sendAppointmentReminder(cita, usuario, servicio, empleado) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: usuario.email,
      subject: `⏰ Recordatorio: tu cita mañana — ${escapeHtml(servicio.nombre)}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Recordatorio de Cita</h1>
          <p>Hola <strong>${escapeHtml(usuario.nombre)}</strong>,</p>
          <p>Te recordamos que mañana tienes una cita:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Servicio</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${escapeHtml(servicio.nombre)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Profesional</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${escapeHtml(empleado.nombre)} ${escapeHtml(empleado.apellidos)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${cita.hora_inicio} - ${cita.hora_fin}</td></tr>
          </table>
          <p style="color: #6b7280; font-size: 14px;">Si necesitas cancelar, hazlo desde la aplicación antes de tu cita.</p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando recordatorio de cita');
  }
}

/**
 * Enviar email de verificación de cuenta tras registro
 */
async function sendEmailVerification(usuario, verifyUrl) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: usuario.email,
      subject: '✉️ Verifica tu cuenta',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Verifica tu cuenta</h1>
          <p>Hola <strong>${escapeHtml(usuario.nombre)}</strong>,</p>
          <p>Acabas de registrarte en el Sistema de Reservas. Para activar tu cuenta y poder iniciar sesión, confirma que este email es tuyo:</p>
          <p style="margin: 30px 0;">
            <a href="${verifyUrl}" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Verificar mi cuenta
            </a>
          </p>
          <p style="color: #6b7280; font-size: 13px;">Este enlace expirará en 24 horas. Si no fuiste tú, ignora este email — la cuenta no se activará.</p>
        </div>
      `,
    });
    logger.info({ to: usuario.email }, 'Email de verificación enviado');
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de verificación');
  }
}

/**
 * Enviar email de recuperación de contraseña
 */
async function sendPasswordReset(usuario, resetUrl) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: usuario.email,
      subject: '🔐 Recuperación de contraseña',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Recuperar contraseña</h1>
          <p>Hola <strong>${escapeHtml(usuario.nombre)}</strong>,</p>
          <p>Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón para continuar:</p>
          <p style="margin: 30px 0;">
            <a href="${resetUrl}" style="background: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Restablecer contraseña
            </a>
          </p>
          <p style="color: #6b7280; font-size: 13px;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este email.</p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de recuperación de contraseña');
  }
}

/* =============================================
   MÓDULO SAAS — EMAILS DE GESTIÓN DE NEGOCIOS
   Mismo estilo y try/catch fire-and-forget que los emails anteriores.
   Todos los textos dinámicos pasan por escapeHtml() para evitar HTML injection.
   ============================================= */

/**
 * Email enviado al BUSINESS_OWNER tras registrar el negocio.
 * Mensaje: "tu solicitud está en revisión".
 */
async function sendBusinessReceivedEmail(ownerEmail, businessNombre) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: ownerEmail,
      subject: `📨 Solicitud recibida — ${businessNombre}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Hemos recibido tu solicitud</h1>
          <p>Hola,</p>
          <p>Tu negocio <strong>${escapeHtml(businessNombre)}</strong> ha sido registrado correctamente y está pendiente de aprobación.</p>
          <p>Nuestro equipo revisará la información en un plazo de <strong>24-48 horas</strong>. Recibirás un nuevo email cuando el estado cambie.</p>
          <p style="color: #6b7280; font-size: 13px; margin-top: 30px;">Si tienes alguna duda, responde a este correo.</p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email "solicitud recibida"');
  }
}

/**
 * Email al ADMIN avisando de una nueva empresa pendiente.
 */
async function sendAdminNewBusinessEmail(adminEmail, businessNombre, businessId) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: adminEmail,
      subject: `🔔 Nueva empresa pendiente — ${businessNombre}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f97316;">Nueva empresa pendiente de aprobación</h1>
          <p>Acaba de registrarse el negocio <strong>${escapeHtml(businessNombre)}</strong> (ID #${businessId}).</p>
          <p>Revisa los datos y aprueba o rechaza desde el panel de administración.</p>
          <p style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/businesses/${businessId}"
               style="background: #f97316; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Ir al panel de admin
            </a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email al admin sobre nueva empresa');
  }
}

/**
 * Email al BUSINESS_OWNER cuando su negocio queda APROBADO (o REACTIVADO).
 */
async function sendBusinessApprovedEmail(ownerEmail, businessNombre) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: ownerEmail,
      subject: `✅ ¡${businessNombre} ya está activo!`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">¡Tu negocio está activo!</h1>
          <p>Hola,</p>
          <p>Nos complace informarte de que <strong>${escapeHtml(businessNombre)}</strong> ya está disponible en la plataforma.</p>
          <p>Ya puedes iniciar sesión y empezar a configurar tus servicios, empleados y horarios.</p>
          <p style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/business/dashboard"
               style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Ir a mi panel
            </a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de aprobación de negocio');
  }
}

/**
 * Email al BUSINESS_OWNER cuando su negocio es RECHAZADO. Incluye el motivo.
 */
async function sendBusinessRejectedEmail(ownerEmail, businessNombre, motivo) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: ownerEmail,
      subject: `❌ Tu solicitud no ha sido aprobada — ${businessNombre}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Solicitud no aprobada</h1>
          <p>Hola,</p>
          <p>Lamentamos informarte de que la solicitud para registrar <strong>${escapeHtml(businessNombre)}</strong> no ha sido aprobada.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b;"><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Si crees que se trata de un error, ponte en contacto con soporte respondiendo a este correo.</p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de rechazo de negocio');
  }
}

/**
 * Email al BUSINESS_OWNER cuando su negocio es SUSPENDIDO. Incluye el motivo.
 */
async function sendBusinessSuspendedEmail(ownerEmail, businessNombre, motivo) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: ownerEmail,
      subject: `⏸ Tu negocio ha sido suspendido — ${businessNombre}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f59e0b;">Negocio suspendido</h1>
          <p>Hola,</p>
          <p>Tu negocio <strong>${escapeHtml(businessNombre)}</strong> ha sido suspendido temporalmente. Durante la suspensión no es posible recibir nuevas reservas.</p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>
          </div>
          <p style="color: #6b7280; font-size: 13px;">Para resolver la situación, contacta con el equipo de soporte respondiendo a este correo.</p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de suspensión de negocio');
  }
}

/**
 * Email al CLIENTE cuando el admin suspende su cuenta.
 */
async function sendAccountSuspendedEmail(usuario, motivo) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: usuario.email,
      subject: '⚠️ Tu cuenta ha sido suspendida',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Cuenta suspendida</h1>
          <p>Hola <strong>${escapeHtml(usuario.nombre)}</strong>,</p>
          <p>Tu cuenta ha sido suspendida temporalmente y no podrás iniciar sesión mientras dure la suspensión.</p>
          ${motivo ? `
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b;"><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>
          </div>` : ''}
          <p style="color: #6b7280; font-size: 14px;">Si crees que se trata de un error, contacta con soporte respondiendo a este correo.</p>
        </div>
      `,
    });
    logger.info({ to: usuario.email }, 'Email de suspensión de cuenta enviado');
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de suspensión de cuenta');
  }
}

/**
 * Email al CLIENTE cuando el admin reactiva su cuenta.
 */
async function sendAccountReactivatedEmail(usuario) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: usuario.email,
      subject: '✅ Tu cuenta ha sido reactivada',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">Cuenta reactivada</h1>
          <p>Hola <strong>${escapeHtml(usuario.nombre)}</strong>,</p>
          <p>Tu cuenta ha sido reactivada. Ya puedes volver a iniciar sesión y usar la plataforma con normalidad.</p>
          <p style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Iniciar sesión
            </a>
          </p>
        </div>
      `,
    });
    logger.info({ to: usuario.email }, 'Email de reactivación de cuenta enviado');
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de reactivación de cuenta');
  }
}

/**
 * Email al CLIENTE cuando el negocio CONFIRMA su cita.
 */
async function sendAppointmentConfirmedByBusinessEmail(usuario, cita, servicio, negocioNombre) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: usuario.email,
      subject: `✅ Tu cita ha sido confirmada — ${escapeHtml(servicio.nombre)}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">¡Cita confirmada!</h1>
          <p>Hola <strong>${escapeHtml(usuario.nombre)}</strong>,</p>
          <p><strong>${escapeHtml(negocioNombre)}</strong> ha confirmado tu cita:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Servicio</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${escapeHtml(servicio.nombre)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Negocio</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${escapeHtml(negocioNombre)}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${cita.fecha instanceof Date ? cita.fecha.toISOString().split('T')[0] : cita.fecha}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${cita.hora_inicio} – ${cita.hora_fin}</td></tr>
          </table>
          <p style="color: #6b7280; font-size: 14px;">Si necesitas cancelar, hazlo desde la aplicación.</p>
        </div>
      `,
    });
    logger.info({ to: usuario.email }, 'Email de confirmación por negocio enviado');
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de confirmación por negocio');
  }
}

/**
 * Email al CLIENTE cuando el negocio CANCELA su cita.
 */
async function sendAppointmentCancelledByBusinessEmail(usuario, cita, servicio, negocioNombre, motivo) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: usuario.email,
      subject: `❌ Tu cita ha sido cancelada — ${escapeHtml(servicio.nombre)}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Cita cancelada</h1>
          <p>Hola <strong>${escapeHtml(usuario.nombre)}</strong>,</p>
          <p>Lamentamos informarte que <strong>${escapeHtml(negocioNombre)}</strong> ha cancelado tu cita de <strong>${escapeHtml(servicio.nombre)}</strong> del ${cita.fecha instanceof Date ? cita.fecha.toISOString().split('T')[0] : cita.fecha} a las ${cita.hora_inicio}.</p>
          ${motivo ? `
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b;"><strong>Motivo:</strong> ${escapeHtml(motivo)}</p>
          </div>` : ''}
          <p>Puedes reservar una nueva cita cuando quieras desde la aplicación.</p>
        </div>
      `,
    });
    logger.info({ to: usuario.email }, 'Email de cancelación por negocio enviado');
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de cancelación por negocio');
  }
}

/**
 * Email al OWNER cuando su negocio es reactivado (distinto de aprobado).
 */
async function sendBusinessReactivatedEmail(ownerEmail, businessNombre) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: ownerEmail,
      subject: `✅ Tu negocio ha sido reactivado — ${businessNombre}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">¡Negocio reactivado!</h1>
          <p>Hola,</p>
          <p>Tu negocio <strong>${escapeHtml(businessNombre)}</strong> ha sido reactivado y ya vuelve a estar visible en la plataforma. Puedes volver a recibir nuevas reservas con normalidad.</p>
          <p style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/business/dashboard"
               style="background: #1B3C35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Ir al panel
            </a>
          </p>
          <p style="color: #6b7280; font-size: 13px;">Ten en cuenta que las reservas que fueron canceladas durante la suspensión no se han restaurado automáticamente.</p>
        </div>
      `,
    });
    logger.info({ to: ownerEmail }, 'Email de reactivación de negocio enviado');
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de reactivación de negocio');
  }
}

/**
 * Email al CLIENTE cuando su reserva se cancela automáticamente por suspensión del negocio.
 */
async function sendBookingCancelledDueSuspensionEmail(userEmail, userName, recursoNombre, fecha, horaInicio) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: userEmail,
      subject: `⚠️ Tu reserva ha sido cancelada — ${escapeHtml(recursoNombre)}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f59e0b;">Reserva cancelada</h1>
          <p>Hola <strong>${escapeHtml(userName)}</strong>,</p>
          <p>Lamentamos informarte de que tu reserva ha sido cancelada automáticamente porque el negocio al que pertenece el espacio ha sido suspendido temporalmente por el administrador de la plataforma.</p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>Espacio:</strong> ${escapeHtml(recursoNombre)}</p>
            <p style="margin: 8px 0 0; color: #92400e;"><strong>Fecha:</strong> ${escapeHtml(String(fecha))} a las ${escapeHtml(horaInicio)}</p>
          </div>
          <p>Si realizaste un pago, recibirás el reembolso correspondiente. Puedes reservar otro espacio disponible en la plataforma.</p>
          <p style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/resources"
               style="background: #1B3C35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Ver otros espacios
            </a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de cancelación por suspensión');
  }
}

/**
 * Email al EMPLEADO cuando el negocio al que pertenece es suspendido.
 */
async function sendEmployeeBusinessSuspendedEmail(employeeEmail, employeeName, businessNombre) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: employeeEmail,
      subject: `⏸ Aviso sobre ${escapeHtml(businessNombre)}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f59e0b;">Actividad suspendida</h1>
          <p>Hola <strong>${escapeHtml(employeeName)}</strong>,</p>
          <p>Te informamos de que el negocio <strong>${escapeHtml(businessNombre)}</strong> en el que estás registrado ha sido suspendido temporalmente por el administrador de la plataforma.</p>
          <p>Durante la suspensión tu perfil permanece inactivo. Para más información, contacta directamente con el responsable del negocio.</p>
          <p style="color: #6b7280; font-size: 13px;">Este es un mensaje automático. No respondas a este correo.</p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de suspensión a empleado');
  }
}

/**
 * Email al EMPLEADO cuando el negocio al que pertenece es reactivado.
 */
async function sendEmployeeBusinessReactivatedEmail(employeeEmail, employeeName, businessNombre) {
  try {
    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: employeeEmail,
      subject: `✅ ${escapeHtml(businessNombre)} ha sido reactivado`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #10b981;">Negocio reactivado</h1>
          <p>Hola <strong>${escapeHtml(employeeName)}</strong>,</p>
          <p>El negocio <strong>${escapeHtml(businessNombre)}</strong> ha sido reactivado y vuelve a estar operativo en la plataforma.</p>
          <p>Tu perfil de empleado ha sido reactivado automáticamente. Ponte en contacto con el responsable del negocio para coordinar la vuelta a la actividad normal.</p>
          <p style="color: #6b7280; font-size: 13px;">Este es un mensaje automático. No respondas a este correo.</p>
        </div>
      `,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error enviando email de reactivación a empleado');
  }
}

module.exports = {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendResourceBookingConfirmation,
  sendWelcomeEmail,
  sendAppointmentReminder,
  sendPasswordReset,
  sendEmailVerification,
  sendBusinessReceivedEmail,
  sendAdminNewBusinessEmail,
  sendBusinessApprovedEmail,
  sendBusinessRejectedEmail,
  sendBusinessSuspendedEmail,
  sendBusinessReactivatedEmail,
  sendBookingCancelledDueSuspensionEmail,
  sendEmployeeBusinessSuspendedEmail,
  sendEmployeeBusinessReactivatedEmail,
  sendAccountSuspendedEmail,
  sendAccountReactivatedEmail,
  sendAppointmentConfirmedByBusinessEmail,
  sendAppointmentCancelledByBusinessEmail,
};
