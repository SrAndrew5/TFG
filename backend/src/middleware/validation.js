const Joi = require('joi');

/**
 * Middleware genérico de validación con Joi
 * Uso: validate(schema) donde schema es un objeto con { body, params, query }
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    // stripUnknown: campos extra del cliente se descartan en silencio en lugar de
    // devolver un error que delate el shape esperado a un atacante. Mantenemos
    // abortEarly: false para reportar todos los errores reales en una sola respuesta.
    const opts = { abortEarly: false, stripUnknown: true };

    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, opts);
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
      } else {
        req.body = value; // sustituimos por la versión saneada (sin claves desconocidas)
      }
    }

    if (schema.params) {
      const { error } = schema.params.validate(req.params, opts);
      if (error) {
        errors.push(...error.details.map((d) => ({ field: d.path.join('.'), message: d.message })));
      }
    }

    if (schema.query) {
      const { error } = schema.query.validate(req.query, opts);
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

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).max(128).required(),
    }),
  },

  forgotPassword: {
    body: Joi.object({
      email: Joi.string().email({ tlds: false }).required(),
    }),
  },

  resetPassword: {
    body: Joi.object({
      // randomBytes(32).toString('hex') => 64 chars hexadecimales
      token: Joi.string().length(64).hex().required(),
      password: Joi.string().min(8).max(128).required(),
    }),
  },

  resendVerification: {
    body: Joi.object({
      email: Joi.string().email({ tlds: false }).required(),
    }),
  },

  verifyEmail: {
    query: Joi.object({
      token: Joi.string().length(64).hex().required(),
    }),
  },

  updateProfile: {
    body: Joi.object({
      nombre: Joi.string().min(2).max(100),
      apellidos: Joi.string().min(2).max(150),
      telefono: Joi.string().max(20).allow('', null),
    }).min(1),
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
      empleado_id:      Joi.number().integer().positive().required(),
      servicio_id:      Joi.number().integer().positive().required(),
      fecha:            Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
      hora_inicio:      Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
      notas:            Joi.string().max(500).allow('', null),
      codigo_descuento: Joi.string().max(50).allow('', null),
      // precio_pagado eliminado a propósito: lo calcula el servidor en pricing.service
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
      nombre:           Joi.string().min(2).max(150).required(),
      tipo:             Joi.string().valid('MESA', 'SALA', 'PUESTO', 'DESPACHO').required(),
      descripcion:      Joi.string().allow('', null),
      capacidad:        Joi.number().integer().min(1).max(100).default(1),
      ubicacion:        Joi.string().max(200).allow('', null),
      precio_hora:      Joi.number().positive().max(9999.99).required(),
      equipamiento:     Joi.string().allow('', null),
      horario_apertura: Joi.string().pattern(/^\d{2}:\d{2}$/).default('08:00'),
      horario_cierre:   Joi.string().pattern(/^\d{2}:\d{2}$/).default('20:00'),
      latitud:          Joi.number().min(-90).max(90).allow(null),
      longitud:         Joi.number().min(-180).max(180).allow(null),
    }),
  },

  updateResource: {
    body: Joi.object({
      nombre:           Joi.string().min(2).max(150),
      tipo:             Joi.string().valid('MESA', 'SALA', 'PUESTO', 'DESPACHO'),
      descripcion:      Joi.string().allow('', null),
      capacidad:        Joi.number().integer().min(1).max(100),
      ubicacion:        Joi.string().max(200).allow('', null),
      precio_hora:      Joi.number().positive().max(9999.99),
      equipamiento:     Joi.string().allow('', null),
      activo:           Joi.boolean(),
      horario_apertura: Joi.string().pattern(/^\d{2}:\d{2}$/),
      horario_cierre:   Joi.string().pattern(/^\d{2}:\d{2}$/),
      latitud:          Joi.number().min(-90).max(90).allow(null),
      longitud:         Joi.number().min(-180).max(180).allow(null),
    }),
  },

  // --- Reservas de Recursos ---
  createResourceBooking: {
    body: Joi.object({
      recurso_id:       Joi.number().integer().positive().required(),
      fecha:            Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
      hora_inicio:      Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
      hora_fin:         Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
      notas:            Joi.string().max(500).allow('', null),
      codigo_descuento: Joi.string().max(50).allow('', null),
      // precio_pagado eliminado a propósito: lo calcula el servidor en pricing.service
    }).custom((value, helpers) => {
      const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      if (toMin(value.hora_fin) <= toMin(value.hora_inicio)) {
        return helpers.error('any.invalid');
      }
      return value;
    }).messages({ 'any.invalid': 'hora_fin debe ser posterior a hora_inicio' }),
  },

  // --- Reseñas ---
  createReview: {
    body: Joi.object({
      cita_id:            Joi.number().integer().positive(),
      reserva_recurso_id: Joi.number().integer().positive(),
      rating:             Joi.number().integer().min(1).max(5).required(),
      comentario:         Joi.string().max(300).allow('', null),
    }).xor('cita_id', 'reserva_recurso_id') // exactamente una de las dos
      .messages({
        'object.missing':  'Debes indicar cita_id o reserva_recurso_id',
        'object.xor':      'Indica solo cita_id o reserva_recurso_id, no ambos',
      }),
  },

  reviewsQuery: {
    query: Joi.object({
      servicio_id: Joi.number().integer().positive(),
      recurso_id:  Joi.number().integer().positive(),
      page:        Joi.number().integer().min(1).default(1),
      limit:       Joi.number().integer().min(1).max(100).default(20),
    }).oxor('servicio_id', 'recurso_id'), // 0 o 1, no ambos
  },

  // --- Notificaciones ---
  createNotification: {
    body: Joi.object({
      type: Joi.string()
        .valid('info', 'success', 'warning', 'error', 'booking', 'reminder', 'review', 'space')
        .default('info'),
      title: Joi.string().min(1).max(200).required(),
      body: Joi.string().max(2000).allow('', null),
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
