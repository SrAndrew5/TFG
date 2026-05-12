const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Reservas API',
      version: '1.0.0',
      description: 'API REST para el sistema de reservas de peluquería y coworking (TFG)',
    },
    servers: [{ url: '/api', description: 'Servidor local' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Autenticación y gestión de cuenta' },
      { name: 'Services', description: 'Servicios de peluquería' },
      { name: 'Employees', description: 'Empleados' },
      { name: 'Availability', description: 'Disponibilidad de empleados' },
      { name: 'Appointments', description: 'Citas de peluquería' },
      { name: 'Resources', description: 'Espacios de coworking' },
      { name: 'Resource Bookings', description: 'Reservas de espacios' },
      { name: 'Admin', description: 'Panel de administración' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
