const Joi = require('joi');

const TIPOS_NEGOCIO = [
  'PELUQUERIA',
  'BARBERIA',
  'COWORKING',
  'SPA',
  'CENTRO_ESTETICA',
  'GIMNASIO',
  'OTRO',
];

// Cada día de la semana: o bien { abre, cierra, cerrado: false } o { cerrado: true }
const horarioDiaSchema = Joi.object({
  cerrado: Joi.boolean().default(false),
  abre:    Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).when('cerrado', { is: false, then: Joi.required() }),
  cierra:  Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).when('cerrado', { is: false, then: Joi.required() }),
});

const horarioSchema = Joi.object({
  lunes:     horarioDiaSchema,
  martes:    horarioDiaSchema,
  miercoles: horarioDiaSchema,
  jueves:    horarioDiaSchema,
  viernes:   horarioDiaSchema,
  sabado:    horarioDiaSchema,
  domingo:   horarioDiaSchema,
});

/**
 * POST /api/businesses/register
 * El registro envía datos del responsable + datos del negocio + horario en un solo body.
 * Los pasos del wizard frontend acumulan todo y disparan una sola petición al final.
 */
const registerBusiness = {
  body: Joi.object({
    // --- Datos del responsable ---
    nombre_responsable:   Joi.string().min(2).max(100).required(),
    apellidos_responsable: Joi.string().min(2).max(150).allow('', null),
    email:                Joi.string().email({ tlds: false }).required(),
    password:             Joi.string().min(8).max(128).required(),
    telefono_responsable: Joi.string().min(9).max(20).required(),

    // --- Datos del negocio ---
    nombre:        Joi.string().min(2).max(150).required(),
    tipo:          Joi.string().valid(...TIPOS_NEGOCIO).required(),
    cif_nif:       Joi.string().pattern(/^[A-Z0-9]{8,9}$/).required()
                       .messages({ 'string.pattern.base': 'CIF/NIF inválido (8-9 caracteres alfanuméricos en mayúsculas)' }),
    descripcion:   Joi.string().max(500).allow('', null),
    direccion:     Joi.string().min(5).max(255).required(),
    ciudad:        Joi.string().min(2).max(100).required(),
    codigo_postal: Joi.string().pattern(/^\d{5}$/).required()
                       .messages({ 'string.pattern.base': 'Código postal inválido (5 dígitos)' }),
    telefono:      Joi.string().min(9).max(20).required(),
    web:           Joi.string().uri().max(255).allow('', null),
    lat:           Joi.number().min(-90).max(90).allow(null),
    lng:           Joi.number().min(-180).max(180).allow(null),

    horario:       horarioSchema.allow(null),

    // Imágenes — opcionales en este endpoint. El upload real va por endpoints aparte si se quiere
    logo_url:      Joi.string().uri().max(500).allow('', null),
    fotos_urls:    Joi.array().items(Joi.string().uri().max(500)).max(5).allow(null),

    // Aceptación de términos (validación de presencia, no se persiste)
    acepta_terminos:    Joi.boolean().valid(true).required()
                            .messages({ 'any.only': 'Debes aceptar los términos y condiciones' }),
    acepta_privacidad:  Joi.boolean().valid(true).required()
                            .messages({ 'any.only': 'Debes aceptar la política de privacidad' }),
  }),
};

/**
 * Body schema para acciones de admin que requieren motivo (rechazar, suspender).
 */
const motivoBody = {
  body: Joi.object({
    motivo: Joi.string().min(5).max(500).required(),
  }),
};

/**
 * Query schema para el listado de negocios en el panel admin.
 */
const adminListQuery = {
  query: Joi.object({
    estado: Joi.string().valid('PENDIENTE', 'ACTIVO', 'SUSPENDIDO', 'RECHAZADO'),
    tipo:   Joi.string().valid(...TIPOS_NEGOCIO),
    ciudad: Joi.string().max(100),
    search: Joi.string().max(150),
    page:   Joi.number().integer().min(1).default(1),
    limit:  Joi.number().integer().min(1).max(100).default(20),
  }),
};

const idParam = {
  params: Joi.object({
    id: Joi.number().integer().positive().required(),
  }),
};

/**
 * PUT /api/businesses/me
 * El owner solo puede editar campos "blandos". cif_nif, slug, owner_id, estado
 * son inmutables desde aquí (los gestiona el admin o son derivados).
 */
const updateMyBusiness = {
  body: Joi.object({
    nombre:        Joi.string().min(2).max(150),
    descripcion:   Joi.string().max(500).allow('', null),
    direccion:     Joi.string().min(5).max(255),
    ciudad:        Joi.string().min(2).max(100),
    codigo_postal: Joi.string().pattern(/^\d{5}$/),
    telefono:      Joi.string().min(9).max(20),
    web:           Joi.string().uri().max(255).allow('', null),
    lat:           Joi.number().min(-90).max(90).allow(null),
    lng:           Joi.number().min(-180).max(180).allow(null),
    logo_url:      Joi.string().uri().max(500).allow('', null),
    fotos_urls:    Joi.array().items(Joi.string().uri().max(500)).max(5).allow(null),
    horario:       horarioSchema.allow(null),
  }).min(1), // al menos un campo
};

/**
 * GET /api/business/appointments query
 */
const businessAppointmentsQuery = {
  query: Joi.object({
    range:  Joi.string().valid('today', 'week', 'month', 'all').default('all'),
    estado: Joi.string().valid('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'),
    search: Joi.string().max(150),
    page:   Joi.number().integer().min(1).default(1),
    limit:  Joi.number().integer().min(1).max(100).default(20),
  }),
};

/**
 * PATCH /api/business/appointments/:id/status
 */
const updateAppointmentStatus = {
  body: Joi.object({
    estado: Joi.string().valid('CONFIRMADA', 'CANCELADA', 'COMPLETADA').required(),
    motivo: Joi.string().max(500).allow('', null),
  }),
};

const CATEGORIAS_SERVICIO = ['Corte', 'Color', 'Tratamiento', 'Barba', 'Manicura', 'Otro'];
const DURACIONES_SERVICIO = [15, 30, 45, 60, 90, 120];

/**
 * POST /api/businesses/services
 */
const createService = {
  body: Joi.object({
    nombre:       Joi.string().min(2).max(150).required(),
    descripcion:  Joi.string().max(500).allow('', null),
    precio:       Joi.number().positive().precision(2).required(),
    duracion_min: Joi.number().integer().valid(...DURACIONES_SERVICIO).required(),
    categoria:    Joi.string().valid(...CATEGORIAS_SERVICIO).allow('', null),
    activo:       Joi.boolean().default(true),
  }),
};

/**
 * PUT /api/businesses/services/:id
 */
const updateService = {
  body: Joi.object({
    nombre:       Joi.string().min(2).max(150),
    descripcion:  Joi.string().max(500).allow('', null),
    precio:       Joi.number().positive().precision(2),
    duracion_min: Joi.number().integer().valid(...DURACIONES_SERVICIO),
    categoria:    Joi.string().valid(...CATEGORIAS_SERVICIO).allow('', null),
    activo:       Joi.boolean(),
  }).min(1),
};

/**
 * POST /api/businesses/employees
 */
const createEmployee = {
  body: Joi.object({
    nombre:       Joi.string().min(2).max(100).required(),
    apellidos:    Joi.string().min(2).max(150).required(),
    email:        Joi.string().email({ tlds: false }).required(),
    telefono:     Joi.string().min(9).max(20).allow('', null),
    especialidad: Joi.string().max(200).allow('', null),
    activo:       Joi.boolean().default(true),
  }),
};

/**
 * PUT /api/businesses/employees/:id
 */
const updateEmployee = {
  body: Joi.object({
    nombre:       Joi.string().min(2).max(100),
    apellidos:    Joi.string().min(2).max(150),
    email:        Joi.string().email({ tlds: false }),
    telefono:     Joi.string().min(9).max(20).allow('', null),
    especialidad: Joi.string().max(200).allow('', null),
    activo:       Joi.boolean(),
  }).min(1),
};

const resourceBookingsQuery = {
  query: Joi.object({
    estado:       Joi.string().valid('PENDIENTE', 'CONFIRMADA', 'CANCELADA'),
    fecha_desde:  Joi.string().isoDate(),
    fecha_hasta:  Joi.string().isoDate(),
    search:       Joi.string().max(150),
    page:         Joi.number().integer().min(1).default(1),
    limit:        Joi.number().integer().min(1).max(100).default(20),
  }),
};

const updateResourceBookingStatus = {
  body: Joi.object({
    estado: Joi.string().valid('CONFIRMADA', 'CANCELADA').required(),
  }),
};

module.exports = {
  registerBusiness,
  motivoBody,
  adminListQuery,
  idParam,
  TIPOS_NEGOCIO,
  updateMyBusiness,
  businessAppointmentsQuery,
  updateAppointmentStatus,
  createService,
  updateService,
  createEmployee,
  updateEmployee,
  resourceBookingsQuery,
  updateResourceBookingStatus,
};
