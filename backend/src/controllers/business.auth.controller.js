const prisma = require('../config/database');
const { hashPassword } = require('../utils/hash');
const {
  sendBusinessReceivedEmail,
  sendAdminNewBusinessEmail,
  sendBusinessApprovedEmail,
  sendBusinessRejectedEmail,
  sendBusinessSuspendedEmail,
  sendBusinessReactivatedEmail,
  sendBookingCancelledDueSuspensionEmail,
  sendEmployeeBusinessSuspendedEmail,
  sendEmployeeBusinessReactivatedEmail,
} = require('../services/email.service');
const { emitToUser } = require('../config/socket');
const { audit } = require('../middleware/audit');
const logger = require('../config/logger');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.SMTP_FROM || 'admin@reservas.local';

function slugify(text) {
  return String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 180) || 'negocio';
}

async function generateUniqueSlug(tx, baseName) {
  const base = slugify(baseName);
  let candidate = base;
  let suffix = 2;
  while (await tx.business.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function registerBusiness(req, res, next) {
  try {
    const {
      nombre_responsable,
      apellidos_responsable,
      email,
      password,
      telefono_responsable,
      nombre,
      tipo,
      cif_nif,
      descripcion,
      direccion,
      ciudad,
      codigo_postal,
      telefono,
      web,
      lat,
      lng,
      horario,
      logo_url,
      fotos_urls,
    } = req.body;

    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Ya existe una cuenta con ese email' });
    }
    const existingCif = await prisma.business.findUnique({ where: { cif_nif } });
    if (existingCif) {
      return res.status(409).json({ success: false, message: 'Ya existe un negocio con ese CIF/NIF' });
    }

    const hashed = await hashPassword(password);
    const cifUpper = cif_nif.toUpperCase();

    const business = await prisma.$transaction(async (tx) => {
      const slug = await generateUniqueSlug(tx, nombre);

      const usuario = await tx.usuario.create({
        data: {
          nombre: nombre_responsable,
          apellidos: apellidos_responsable || nombre_responsable,
          email,
          password: hashed,
          telefono: telefono_responsable,
          rol: 'BUSINESS_OWNER',
          email_verificado: true,
        },
      });

      return tx.business.create({
        data: {
          nombre, slug, tipo, cif_nif: cifUpper, descripcion: descripcion || null,
          direccion, ciudad, codigo_postal, lat: lat ?? null, lng: lng ?? null,
          telefono, web: web || null, logo_url: logo_url || null,
          fotos_urls: fotos_urls && fotos_urls.length > 0 ? fotos_urls : null,
          horario: horario || null, estado: 'PENDIENTE', owner_id: usuario.id,
        },
      });
    });

    sendBusinessReceivedEmail(email, business.nombre).catch((err) => logger.error({ err }, 'Error email "recibida"'));
    sendAdminNewBusinessEmail(ADMIN_EMAIL, business.nombre, business.id).catch((err) => logger.error({ err }, 'Error email admin'));

    audit({ usuarioId: business.owner_id, accion: 'REGISTRAR_NEGOCIO', entidad: 'business', entidadId: business.id, ip: req.ip });

    return res.status(201).json({ success: true, message: 'Solicitud registrada.', data: { business } });
  } catch (error) { next(error); }
}

async function getMyBusiness(req, res, next) {
  try {
    const business = await prisma.business.findUnique({ where: { owner_id: req.user.id } });
    if (!business) return res.status(404).json({ success: false, message: 'No tienes ningún negocio registrado' });
    return res.json({ success: true, data: business });
  } catch (error) { next(error); }
}

async function adminListBusinesses(req, res, next) {
  try {
    const { estado, tipo, ciudad, search, page = 1, limit = 20 } = req.query;
    const take = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

    const where = {};
    if (estado) where.estado = estado;
    if (tipo)   where.tipo = tipo;
    if (ciudad) where.ciudad = ciudad;
    if (search) {
      where.OR = [{ nombre: { contains: search } }, { cif_nif: { contains: search.toUpperCase() } }];
    }

    const [items, total, pendientes] = await Promise.all([
      prisma.business.findMany({
        where,
        include: { owner: { select: { id: true, nombre: true, email: true } } },
        orderBy: [{ estado: 'asc' }, { created_at: 'desc' }],
        skip, take,
      }),
      prisma.business.count({ where }),
      prisma.business.count({ where: { estado: 'PENDIENTE' } }),
    ]);

    return res.json({ success: true, data: items, total, page: parseInt(page), limit: take, meta: { pendientes } });
  } catch (error) { next(error); }
}

async function adminGetBusiness(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const business = await prisma.business.findUnique({
      where: { id },
      include: { owner: true, _count: true },
    });
    if (!business) return res.status(404).json({ success: false, message: 'Negocio no encontrado' });
    return res.json({ success: true, data: business });
  } catch (error) { next(error); }
}

async function approveBusiness(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const business = await prisma.business.findUnique({ where: { id }, include: { owner: true } });
    if (!business) return res.status(404).json({ success: false, message: 'Negocio no encontrado' });

    const updated = await prisma.business.update({ where: { id }, data: { estado: 'ACTIVO', motivo_rechazo: null } });
    sendBusinessApprovedEmail(business.owner.email, business.nombre).catch((err) => logger.error({ err }, 'Error email'));
    audit({ usuarioId: req.user.id, accion: 'APROBAR_NEGOCIO', entidad: 'business', entidadId: id, ip: req.ip });

    return res.json({ success: true, message: 'Negocio aprobado', data: updated });
  } catch (error) { next(error); }
}

async function rejectBusiness(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;
    const business = await prisma.business.findUnique({ where: { id }, include: { owner: true } });
    if (!business) return res.status(404).json({ success: false, message: 'Negocio no encontrado' });

    const updated = await prisma.business.update({ where: { id }, data: { estado: 'RECHAZADO', motivo_rechazo: motivo } });
    sendBusinessRejectedEmail(business.owner.email, business.nombre, motivo).catch((err) => logger.error({ err }, 'Error email'));
    audit({ usuarioId: req.user.id, accion: 'RECHAZAR_NEGOCIO', entidad: 'business', entidadId: id, ip: req.ip });

    return res.json({ success: true, message: 'Negocio rechazado', data: updated });
  } catch (error) { next(error); }
}

async function suspendBusiness(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;
    const business = await prisma.business.findUnique({ where: { id }, include: { owner: true } });
    if (!business) return res.status(404).json({ success: false, message: 'Negocio no encontrado' });

    const updated = await prisma.business.update({ where: { id }, data: { estado: 'SUSPENDIDO', motivo_rechazo: motivo } });
    audit({ usuarioId: req.user.id, accion: 'SUSPENDER_NEGOCIO', entidad: 'business', entidadId: id, ip: req.ip });

    // ── Cascada de suspensión (async, no bloquea la respuesta) ──
    setImmediate(async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Cancelar reservas futuras de los recursos de este negocio
        const futuras = await prisma.reservaRecurso.findMany({
          where: {
            recurso: { business_id: id },
            fecha: { gte: today },
            estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
          },
          include: { usuario: true, recurso: true },
        });

        if (futuras.length > 0) {
          await prisma.reservaRecurso.updateMany({
            where: { id: { in: futuras.map((r) => r.id) } },
            data: { estado: 'CANCELADA' },
          });

          for (const reserva of futuras) {
            // Email al usuario afectado
            sendBookingCancelledDueSuspensionEmail(
              reserva.usuario.email,
              reserva.usuario.nombre,
              reserva.recurso.nombre,
              reserva.fecha,
              reserva.hora_inicio,
            ).catch(() => {});

            // Notificación in-app en tiempo real
            const notif = await prisma.notification.create({
              data: {
                usuario_id: reserva.usuario_id,
                type: 'warning',
                title: 'Reserva cancelada automáticamente',
                body: `Tu reserva de "${reserva.recurso.nombre}" del ${new Date(reserva.fecha).toLocaleDateString('es-ES')} a las ${reserva.hora_inicio} ha sido cancelada porque el negocio ha sido suspendido.`,
              },
            });
            emitToUser(reserva.usuario_id, 'notification', notif);
          }
        }

        // 2. Desactivar empleados del negocio y notificarles
        const empleados = await prisma.empleado.findMany({
          where: { business_id: id, activo: true },
        });
        if (empleados.length > 0) {
          await prisma.empleado.updateMany({
            where: { business_id: id, activo: true },
            data: { activo: false },
          });
          for (const emp of empleados) {
            sendEmployeeBusinessSuspendedEmail(emp.email, emp.nombre, business.nombre).catch(() => {});
          }
        }

        // 3. Notificación in-app al owner
        const ownerNotif = await prisma.notification.create({
          data: {
            usuario_id: business.owner_id,
            type: 'suspended',
            title: 'Tu negocio ha sido suspendido',
            body: motivo ? `Motivo: ${motivo}` : 'Contacta con soporte para más información.',
          },
        });
        emitToUser(business.owner_id, 'notification', ownerNotif);

        logger.info({ businessId: id, reservasCanceladas: futuras.length, empleadosDesactivados: empleados.length }, 'Cascada de suspensión completada');
      } catch (err) {
        logger.error({ err, businessId: id }, 'Error en cascada de suspensión');
      }
    });

    sendBusinessSuspendedEmail(business.owner.email, business.nombre, motivo).catch((err) => logger.error({ err }, 'Error email'));
    return res.json({ success: true, message: 'Negocio suspendido', data: updated });
  } catch (error) { next(error); }
}

async function reactivateBusiness(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const business = await prisma.business.findUnique({ where: { id }, include: { owner: true } });
    if (!business) return res.status(404).json({ success: false, message: 'Negocio no encontrado' });

    const updated = await prisma.business.update({ where: { id }, data: { estado: 'ACTIVO', motivo_rechazo: null } });
    audit({ usuarioId: req.user.id, accion: 'REACTIVAR_NEGOCIO', entidad: 'business', entidadId: id, ip: req.ip });

    // ── Cascada de reactivación (async, no bloquea la respuesta) ──
    setImmediate(async () => {
      try {
        // 1. Reactivar empleados que fueron desactivados por la suspensión
        const empleados = await prisma.empleado.findMany({
          where: { business_id: id, activo: false },
        });
        if (empleados.length > 0) {
          await prisma.empleado.updateMany({
            where: { business_id: id, activo: false },
            data: { activo: true },
          });
          for (const emp of empleados) {
            sendEmployeeBusinessReactivatedEmail(emp.email, emp.nombre, business.nombre).catch(() => {});
          }
        }

        // 2. Notificación in-app al owner
        const ownerNotif = await prisma.notification.create({
          data: {
            usuario_id: business.owner_id,
            type: 'reactivated',
            title: '¡Tu negocio ha sido reactivado!',
            body: 'Ya puedes volver a recibir reservas. Ten en cuenta que las reservas canceladas durante la suspensión no se han restaurado automáticamente.',
          },
        });
        emitToUser(business.owner_id, 'notification', ownerNotif);

        logger.info({ businessId: id, empleadosReactivados: empleados.length }, 'Cascada de reactivación completada');
      } catch (err) {
        logger.error({ err, businessId: id }, 'Error en cascada de reactivación');
      }
    });

    sendBusinessReactivatedEmail(business.owner.email, business.nombre).catch((err) => logger.error({ err }, 'Error email'));
    return res.json({ success: true, message: 'Negocio reactivado', data: updated });
  } catch (error) { next(error); }
}

module.exports = {
  registerBusiness,
  getMyBusiness,
  adminListBusinesses,
  adminGetBusiness,
  approveBusiness,
  rejectBusiness,
  suspendBusiness,
  reactivateBusiness,
};
