const { Router } = require('express');
const authCtrl = require('../controllers/business.auth.controller');
const mgmtCtrl = require('../controllers/business.management.controller');
const analyticsCtrl = require('../controllers/business.analytics.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');
const { validate } = require('../middleware/validation');
const businessSchemas = require('../validations/business.validations');
const upload = require('../middleware/upload');

// ──────────────────────────────────────────────────────
// Rutas públicas / para el propio BUSINESS_OWNER
// Montar con: app.use('/api/businesses', publicRouter)
// ──────────────────────────────────────────────────────
const publicRouter = Router();

// ── Endpoints PÚBLICOS (sin auth) — Explorador de negocios ──

// GET /api/businesses — lista de negocios ACTIVOS para mapa y buscador
publicRouter.get(
  '/',
  mgmtCtrl.getPublicBusinesses,
);

// ⚠️  Las rutas con :slug van DESPUÉS de /register, /me, /appointments, /stats
//     para evitar que "register" o "me" se interpreten como un slug.

publicRouter.post(
  '/register',
  validate(businessSchemas.registerBusiness),
  authCtrl.registerBusiness,
);


publicRouter.get(
  '/me',
  authenticate,
  authorize('BUSINESS_OWNER'),
  authCtrl.getMyBusiness,
);

publicRouter.put(
  '/me',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.updateMyBusiness),
  mgmtCtrl.updateMyBusiness,
);

// Citas y stats del negocio. Aunque conceptualmente van bajo /api/business/...,
// los exponemos en el publicRouter por simplicidad (todos requieren BUSINESS_OWNER).
publicRouter.get(
  '/appointments',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.businessAppointmentsQuery),
  analyticsCtrl.getBusinessAppointments,
);

publicRouter.patch(
  '/appointments/:id/status',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.idParam),
  validate(businessSchemas.updateAppointmentStatus),
  analyticsCtrl.updateBusinessAppointmentStatus,
);

publicRouter.get(
  '/stats',
  authenticate,
  authorize('BUSINESS_OWNER'),
  analyticsCtrl.getBusinessStats,
);

// ── Fotos y logo (BUSINESS_OWNER) ─────────────────────────────────────────

publicRouter.post(
  '/me/logo',
  authenticate,
  authorize('BUSINESS_OWNER'),
  upload.single('logo'),
  mgmtCtrl.uploadBusinessLogo,
);

publicRouter.post(
  '/me/photos',
  authenticate,
  authorize('BUSINESS_OWNER'),
  upload.single('photo'),
  mgmtCtrl.uploadBusinessPhoto,
);

publicRouter.delete(
  '/me/photos',
  authenticate,
  authorize('BUSINESS_OWNER'),
  mgmtCtrl.deleteBusinessPhoto,
);

// ── Servicios del negocio (BUSINESS_OWNER) ──────────────────────────────────

publicRouter.get(
  '/services',
  authenticate,
  authorize('BUSINESS_OWNER'),
  mgmtCtrl.getMyServices,
);

publicRouter.post(
  '/services',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.createService),
  mgmtCtrl.createMyService,
);

publicRouter.put(
  '/services/:id',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.idParam),
  validate(businessSchemas.updateService),
  mgmtCtrl.updateMyService,
);

publicRouter.delete(
  '/services/:id',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.idParam),
  mgmtCtrl.deleteMyService,
);

// ── Empleados del negocio (BUSINESS_OWNER) ───────────────────────────────────

publicRouter.get(
  '/employees',
  authenticate,
  authorize('BUSINESS_OWNER'),
  mgmtCtrl.getMyEmployees,
);

publicRouter.post(
  '/employees',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.createEmployee),
  mgmtCtrl.createMyEmployee,
);

publicRouter.put(
  '/employees/:id',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.idParam),
  validate(businessSchemas.updateEmployee),
  mgmtCtrl.updateMyEmployee,
);

publicRouter.delete(
  '/employees/:id',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.idParam),
  mgmtCtrl.deleteMyEmployee,
);

// ── Recursos/Espacios del negocio (BUSINESS_OWNER) ───────────────────────────

publicRouter.get(
  '/resources',
  authenticate,
  authorize('BUSINESS_OWNER'),
  mgmtCtrl.getMyResources,
);

publicRouter.post(
  '/resources',
  authenticate,
  authorize('BUSINESS_OWNER'),
  mgmtCtrl.createMyResource,
);

publicRouter.put(
  '/resources/:id',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.idParam),
  mgmtCtrl.updateMyResource,
);

publicRouter.delete(
  '/resources/:id',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.idParam),
  mgmtCtrl.deleteMyResource,
);

// ── Reservas de espacios del negocio (BUSINESS_OWNER) ────────────────────────

publicRouter.get(
  '/resource-bookings',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.resourceBookingsQuery),
  analyticsCtrl.getBusinessResourceBookings,
);

publicRouter.patch(
  '/resource-bookings/:id/status',
  authenticate,
  authorize('BUSINESS_OWNER'),
  validate(businessSchemas.idParam),
  validate(businessSchemas.updateResourceBookingStatus),
  analyticsCtrl.updateBusinessResourceBookingStatus,
);

// ── Rutas con :slug (DESPUÉS de todas las rutas con nombre fijo) ──
// GET /api/businesses/:slug — ficha pública de un negocio
publicRouter.get('/:slug', mgmtCtrl.getPublicBusinessBySlug);

// GET /api/businesses/:slug/availability — slots de disponibilidad
publicRouter.get('/:slug/availability', mgmtCtrl.getBusinessAvailability);

// ──────────────────────────────────────────────────────
// Rutas de administración
// Montar con: app.use('/api/admin/businesses', adminRouter)
// ──────────────────────────────────────────────────────
const adminRouter = Router();

adminRouter.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(businessSchemas.adminListQuery),
  authCtrl.adminListBusinesses,
);

adminRouter.get(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(businessSchemas.idParam),
  authCtrl.adminGetBusiness,
);

adminRouter.patch(
  '/:id/approve',
  authenticate,
  authorize('ADMIN'),
  validate(businessSchemas.idParam),
  authCtrl.approveBusiness,
);

adminRouter.patch(
  '/:id/reject',
  authenticate,
  authorize('ADMIN'),
  validate(businessSchemas.idParam),
  validate(businessSchemas.motivoBody),
  authCtrl.rejectBusiness,
);

adminRouter.patch(
  '/:id/suspend',
  authenticate,
  authorize('ADMIN'),
  validate(businessSchemas.idParam),
  validate(businessSchemas.motivoBody),
  authCtrl.suspendBusiness,
);

adminRouter.patch(
  '/:id/reactivate',
  authenticate,
  authorize('ADMIN'),
  validate(businessSchemas.idParam),
  authCtrl.reactivateBusiness,
);

module.exports = { publicRouter, adminRouter };
