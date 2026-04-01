const Joi = require('joi');

/**
 * Middleware genérico de validación con Joi
 * Uso: validate(schema) donde schema es un objeto con { body, params, query }
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
      }
    }

    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
      }
    }

    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false });
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors,
      });
    }

    next();
  };
}

// =============================================
// SCHEMAS DE VALIDACIÓN
// =============================================

const schemas = {
  // --- Auth ---
  register: {
    body: Joi.object({
      nombre: Joi.string().min(2).max(100).required(),
      apellidos: Joi.string().min(2).max(150).required(),
      email: Joi.string().email({ tlds: false }).required(),
      password: Joi.string().min(8).max(128).required(),
      telefono: Joi.string().max(20).allow('', null),
    }),
  },

  login: {
    body: Joi.object({
      email: Joi.string().email({ tlds: false }).required(),
      password: Joi.string().required(),
    }),
  },

  // --- Servicios ---
  createService: {
    body: Joi.object({
      nombre: Joi.string().min(2).max(150).required(),
      descripcion: Joi.string().allow('', null),
      duracion_min: Joi.number().integer().min(5).max(480).required(),
      precio: Joi.number().positive().max(9999.99).required(),
      categoria: Joi.string().max(100).allow('', null),
    }),
  },

  updateService: {
    body: Joi.object({
      nombre: Joi.string().min(2).max(150),
      descripcion: Joi.string().allow('', null),
      duracion_min: Joi.number().integer().min(5).max(480),
      precio: Joi.number().positive().max(9999.99),
      categoria: Joi.string().max(100).allow('', null),
      activo: Joi.boolean(),
    }),
  },

  // --- Empleados ---
  createEmployee: {
    body: Joi.object({
      nombre: Joi.string().min(2).max(100).required(),
      apellidos: Joi.string().min(2).max(150).required(),
      email: Joi.string().email({ tlds: false }).required(),
      telefono: Joi.string().max(20).allow('', null),
      especialidad: Joi.string().max(200).allow('', null),
    }),
  },

  updateEmployee: {
    body: Joi.object({
      nombre: Joi.string().min(2).max(100),
      apellidos: Joi.string().min(2).max(150),
      email: Joi.string().email({ tlds: false }),
      telefono: Joi.string().max(20).allow('', null),
      especialidad: Joi.string().max(200).allow('', null),
      activo: Joi.boolean(),
    }),
  },

  // --- Disponibilidad ---
  createAvailability: {
    body: Joi.object({
      empleado_id: Joi.number().integer().positive().required(),
      dia_semana: Joi.number().integer().min(0).max(6).required(),
      hora_inicio: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
      hora_fin: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
    }),
  },

  // --- Citas ---
  createAppointment: {
    body: Joi.object({
      empleado_id: Joi.number().integer().positive().required(),
      servicio_id: Joi.number().integer().positive().required(),
      fecha: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
      hora_inicio: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
      notas: Joi.string().max(500).allow('', null),
    }),
  },

  updateAppointmentStatus: {
    body: Joi.object({
      estado: Joi.string().valid('PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA').required(),
    }),
  },

  // --- Recursos (Coworking) ---
  createResource: {
    body: Joi.object({
      nombre: Joi.string().min(2).max(150).required(),
      tipo: Joi.string().valid('MESA', 'SALA', 'PUESTO', 'DESPACHO').required(),
      descripcion: Joi.string().allow('', null),
      capacidad: Joi.number().integer().min(1).max(100).default(1),
      ubicacion: Joi.string().max(200).allow('', null),
      precio_hora: Joi.number().positive().max(9999.99).required(),
      equipamiento: Joi.string().allow('', null),
    }),
  },

  updateResource: {
    body: Joi.object({
      nombre: Joi.string().min(2).max(150),
      tipo: Joi.string().valid('MESA', 'SALA', 'PUESTO', 'DESPACHO'),
      descripcion: Joi.string().allow('', null),
      capacidad: Joi.number().integer().min(1).max(100),
      ubicacion: Joi.string().max(200).allow('', null),
      precio_hora: Joi.number().positive().max(9999.99),
      equipamiento: Joi.string().allow('', null),
      activo: Joi.boolean(),
    }),
  },

  // --- Reservas de Recursos ---
  createResourceBooking: {
    body: Joi.object({
      recurso_id: Joi.number().integer().positive().required(),
      fecha: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
      hora_inicio: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
      hora_fin: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
      notas: Joi.string().max(500).allow('', null),
    }),
  },

  // --- Params genéricos ---
  idParam: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  },
};

module.exports = { validate, schemas };
