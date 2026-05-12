const prisma = require('../config/database');
const { audit } = require('../middleware/audit');
const { uploadFile, deleteFile } = require('../config/storage');
const { getAvailableSlots } = require('../services/availability.service');

async function loadActiveBusinessForOwner(req, res) {
  const business = await prisma.business.findUnique({ where: { owner_id: req.user.id } });
  if (!business) {
    res.status(404).json({ success: false, message: 'No tienes negocio registrado' });
    return null;
  }
  if (business.estado !== 'ACTIVO') {
    res.status(403).json({ success: false, message: 'Tu negocio no está activo' });
    return null;
  }
  return business;
}

async function updateMyBusiness(req, res, next) {
  try {
    const existing = await prisma.business.findUnique({ where: { owner_id: req.user.id } });
    if (!existing) return res.status(404).json({ success: false, message: 'No tienes ningún negocio registrado' });
    const updated = await prisma.business.update({ where: { id: existing.id }, data: req.body });
    audit({ usuarioId: req.user.id, accion: 'EDITAR_NEGOCIO', entidad: 'business', entidadId: existing.id, ip: req.ip });
    return res.json({ success: true, message: 'Perfil actualizado', data: updated });
  } catch (error) { next(error); }
}

async function getMyServices(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const services = await prisma.servicio.findMany({
      where: { business_id: business.id },
      orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
    });
    return res.json({ success: true, data: services });
  } catch (error) { next(error); }
}

async function createMyService(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const service = await prisma.servicio.create({
      data: { ...req.body, business_id: business.id },
    });
    return res.status(201).json({ success: true, data: service });
  } catch (error) { next(error); }
}

async function updateMyService(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const id = parseInt(req.params.id);
    const existing = await prisma.servicio.findFirst({ where: { id, business_id: business.id } });
    if (!existing) return res.status(403).json({ success: false, message: 'No tienes permiso' });
    const updated = await prisma.servicio.update({ where: { id }, data: req.body });
    return res.json({ success: true, data: updated });
  } catch (error) { next(error); }
}

async function deleteMyService(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const id = parseInt(req.params.id);
    const existing = await prisma.servicio.findFirst({ where: { id, business_id: business.id } });
    if (!existing) return res.status(403).json({ success: false, message: 'No tienes permiso' });
    await prisma.servicio.update({ where: { id }, data: { activo: false } });
    return res.json({ success: true, message: 'Servicio desactivado' });
  } catch (error) { next(error); }
}

async function getMyEmployees(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const employees = await prisma.empleado.findMany({
      where: { business_id: business.id },
      orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
    });
    return res.json({ success: true, data: employees });
  } catch (error) { next(error); }
}

async function createMyEmployee(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const employee = await prisma.empleado.create({
      data: { ...req.body, business_id: business.id },
    });
    return res.status(201).json({ success: true, data: employee });
  } catch (error) { next(error); }
}

async function updateMyEmployee(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const id = parseInt(req.params.id);
    const existing = await prisma.empleado.findFirst({ where: { id, business_id: business.id } });
    if (!existing) return res.status(403).json({ success: false, message: 'No tienes permiso' });
    const updated = await prisma.empleado.update({ where: { id }, data: req.body });
    return res.json({ success: true, data: updated });
  } catch (error) { next(error); }
}

async function deleteMyEmployee(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const id = parseInt(req.params.id);
    const existing = await prisma.empleado.findFirst({ where: { id, business_id: business.id } });
    if (!existing) return res.status(403).json({ success: false, message: 'No tienes permiso' });
    await prisma.empleado.update({ where: { id }, data: { activo: false } });
    return res.json({ success: true, message: 'Empleado desactivado' });
  } catch (error) { next(error); }
}

// ── Recursos/Espacios del negocio (BUSINESS_OWNER) ────────────────────────────

async function getMyResources(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const resources = await prisma.recurso.findMany({
      where: { business_id: business.id },
      orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
    });
    return res.json({ success: true, data: resources });
  } catch (error) { next(error); }
}

async function createMyResource(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const resource = await prisma.recurso.create({
      data: { ...req.body, business_id: business.id },
    });
    audit({ usuarioId: req.user.id, accion: 'CREAR_RECURSO', entidad: 'recurso', entidadId: resource.id, ip: req.ip });
    return res.status(201).json({ success: true, data: resource });
  } catch (error) { next(error); }
}

async function updateMyResource(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const id = parseInt(req.params.id);
    const existing = await prisma.recurso.findFirst({ where: { id, business_id: business.id } });
    if (!existing) return res.status(403).json({ success: false, message: 'No tienes permiso sobre este recurso' });
    const updated = await prisma.recurso.update({ where: { id }, data: req.body });
    audit({ usuarioId: req.user.id, accion: 'EDITAR_RECURSO', entidad: 'recurso', entidadId: id, ip: req.ip });
    return res.json({ success: true, data: updated });
  } catch (error) { next(error); }
}

async function deleteMyResource(req, res, next) {
  try {
    const business = await loadActiveBusinessForOwner(req, res);
    if (!business) return;
    const id = parseInt(req.params.id);
    const existing = await prisma.recurso.findFirst({ where: { id, business_id: business.id } });
    if (!existing) return res.status(403).json({ success: false, message: 'No tienes permiso sobre este recurso' });
    // Soft delete — marcamos inactivo, no borramos para preservar reservas históricas
    await prisma.recurso.update({ where: { id }, data: { activo: false } });
    audit({ usuarioId: req.user.id, accion: 'ELIMINAR_RECURSO', entidad: 'recurso', entidadId: id, ip: req.ip });
    return res.json({ success: true, message: 'Espacio desactivado' });
  } catch (error) { next(error); }
}

// ── Fotos y logo del negocio ──────────────────────────────────────────────────

async function uploadBusinessPhoto(req, res, next) {
  try {
    const business = await prisma.business.findUnique({ where: { owner_id: req.user.id } });
    if (!business) return res.status(404).json({ success: false, message: 'No tienes negocio registrado' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No se ha enviado ninguna imagen' });

    const currentPhotos = Array.isArray(business.fotos_urls) ? business.fotos_urls : [];
    if (currentPhotos.length >= 10) {
      return res.status(400).json({ success: false, message: 'Máximo 10 fotos por negocio' });
    }

    const url = await uploadFile(req.file.buffer, req.file.originalname, 'businesses');
    const updated = await prisma.business.update({
      where: { id: business.id },
      data: { fotos_urls: [...currentPhotos, url] },
    });
    return res.status(201).json({ success: true, data: { fotos_urls: updated.fotos_urls } });
  } catch (error) { next(error); }
}

async function deleteBusinessPhoto(req, res, next) {
  try {
    const business = await prisma.business.findUnique({ where: { owner_id: req.user.id } });
    if (!business) return res.status(404).json({ success: false, message: 'No tienes negocio registrado' });

    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL de foto requerida' });

    const currentPhotos = Array.isArray(business.fotos_urls) ? business.fotos_urls : [];
    if (!currentPhotos.includes(url)) return res.status(404).json({ success: false, message: 'Foto no encontrada' });

    await deleteFile(url);
    const updated = await prisma.business.update({
      where: { id: business.id },
      data: { fotos_urls: currentPhotos.filter((p) => p !== url) },
    });
    return res.json({ success: true, data: { fotos_urls: updated.fotos_urls } });
  } catch (error) { next(error); }
}

async function uploadBusinessLogo(req, res, next) {
  try {
    const business = await prisma.business.findUnique({ where: { owner_id: req.user.id } });
    if (!business) return res.status(404).json({ success: false, message: 'No tienes negocio registrado' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No se ha enviado ninguna imagen' });

    if (business.logo_url) await deleteFile(business.logo_url);

    const url = await uploadFile(req.file.buffer, req.file.originalname, 'logos');
    const updated = await prisma.business.update({
      where: { id: business.id },
      data: { logo_url: url },
    });
    return res.json({ success: true, data: { logo_url: updated.logo_url } });
  } catch (error) { next(error); }
}

// PUBLIC
async function getPublicBusinesses(req, res, next) {
  try {
    const { search, tipo, ciudad, rating, abierto } = req.query;
    const where = { estado: 'ACTIVO' };
    if (tipo) where.tipo = tipo;
    if (ciudad) where.ciudad = ciudad;
    if (search) {
      where.OR = [{ nombre: { contains: search } }, { ciudad: { contains: search } }, { descripcion: { contains: search } }];
    }
    const businesses = await prisma.business.findMany({
      where,
      include: { citas: { where: { review: { isNot: null } }, select: { review: true } } },
      take: 200,
    });
    const result = businesses.map(b => {
        const reviews = b.citas.map(c => c.review).filter(Boolean);
        const avg = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
        return { ...b, valoracion_media: avg, total_resenas: reviews.length, citas: undefined };
    });
    return res.json({ success: true, data: result });
  } catch (error) { next(error); }
}

async function getPublicBusinessBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        servicios: { where: { activo: true } },
        empleados: { where: { activo: true } },
        recursos: { where: { activo: true } },
      },
    });
    if (!business || business.estado !== 'ACTIVO') return res.status(404).json({ success: false, message: 'No encontrado' });
    return res.json({ success: true, data: business });
  } catch (error) { next(error); }
}

async function getBusinessAvailability(req, res, next) {
  try {
    const { slug } = req.params;
    const { servicio_id, fecha, empleado_id } = req.query;
    const business = await prisma.business.findUnique({ where: { slug } });
    if (!business) return res.status(404).json({ success: false, message: 'No encontrado' });
    const servicio = await prisma.servicio.findFirst({ where: { id: parseInt(servicio_id), business_id: business.id, activo: true } });
    if (!servicio) return res.status(404).json({ success: false, message: 'Servicio no encontrado' });

    const asignaciones = await prisma.servicioEmpleado.findMany({
      where: { servicio_id: servicio.id, empleado: { activo: true, business_id: business.id }, ...(empleado_id ? { empleado_id: parseInt(empleado_id) } : {}) },
      include: { empleado: true }
    });

    const por_empleado = [];
    for (const asig of asignaciones) {
      const slots = await getAvailableSlots(asig.empleado.id, fecha, servicio.duracion_min);
      por_empleado.push({ empleado: asig.empleado, slots });
    }
    return res.json({ success: true, data: { servicio, fecha, por_empleado } });
  } catch (error) { next(error); }
}

module.exports = {
  updateMyBusiness,
  getMyServices,
  createMyService,
  updateMyService,
  deleteMyService,
  getMyEmployees,
  createMyEmployee,
  updateMyEmployee,
  deleteMyEmployee,
  getMyResources,
  createMyResource,
  updateMyResource,
  deleteMyResource,
  uploadBusinessPhoto,
  deleteBusinessPhoto,
  uploadBusinessLogo,
  getPublicBusinesses,
  getPublicBusinessBySlug,
  getBusinessAvailability,
};
