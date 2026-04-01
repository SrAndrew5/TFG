const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
  // No auth needed for Mailpit
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
      subject: `✅ Cita confirmada — ${servicio.nombre}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Cita Confirmada</h1>
          <p>Hola <strong>${usuario.nombre}</strong>,</p>
          <p>Tu cita ha sido confirmada con los siguientes detalles:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Servicio</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${servicio.nombre}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Profesional</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${empleado.nombre} ${empleado.apellidos}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${cita.fecha}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Hora</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${cita.hora_inicio} - ${cita.hora_fin}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Precio</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${servicio.precio}€</td></tr>
          </table>
          <p style="color: #6b7280; font-size: 14px;">Si necesitas cancelar o modificar tu cita, hazlo desde la aplicación.</p>
        </div>
      `,
    });
    console.log(`📧 Email de confirmación enviado a ${usuario.email}`);
  } catch (error) {
    console.error('⚠️  Error enviando email:', error.message);
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
      subject: `❌ Cita cancelada — ${servicio.nombre}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #ef4444;">Cita Cancelada</h1>
          <p>Hola <strong>${usuario.nombre}</strong>,</p>
          <p>Tu cita de <strong>${servicio.nombre}</strong> para el día <strong>${cita.fecha}</strong> a las <strong>${cita.hora_inicio}</strong> ha sido cancelada.</p>
          <p>Puedes reservar una nueva cita desde la aplicación.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('⚠️  Error enviando email de cancelación:', error.message);
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
      subject: `✅ Reserva confirmada — ${recurso.nombre}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6366f1;">Reserva Confirmada</h1>
          <p>Hola <strong>${usuario.nombre}</strong>,</p>
          <p>Tu reserva ha sido confirmada:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Espacio</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${recurso.nombre}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Tipo</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${recurso.tipo}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Ubicación</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${recurso.ubicacion || 'N/A'}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Fecha</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${reserva.fecha}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Horario</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${reserva.hora_inicio} - ${reserva.hora_fin}</td></tr>
          </table>
        </div>
      `,
    });
  } catch (error) {
    console.error('⚠️  Error enviando email de reserva:', error.message);
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
          <p>Hola <strong>${usuario.nombre}</strong>,</p>
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
    console.error('⚠️  Error enviando email de bienvenida:', error.message);
  }
}

module.exports = {
  sendAppointmentConfirmation,
  sendAppointmentCancellation,
  sendResourceBookingConfirmation,
  sendWelcomeEmail,
};
