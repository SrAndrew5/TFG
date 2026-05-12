require('dotenv').config();

// =============================================================
// PENDIENTE ANTES DE HOSTEAR / MEJORAS FUTURAS
// =============================================================
// 1. EMAILS: El servicio de email usa Nodemailer con SMTP básico.
//    Migrar a Resend o SendGrid para mayor fiabilidad en prod.
// 2. PAGOS: La pasarela actual es simulada (modal de confirmación).
//    Integrar Stripe (stripe.com) con webhooks para cobros reales.
//    Añadir tabla `payments` en Prisma para registrar transacciones.
// 3. AUTENTICACIÓN: Añadir verificación de email tras el registro
//    (token de confirmación por email antes de activar la cuenta).
// 5. NOTIFICACIONES: Las notificaciones push son in-memory (se pierden al reiniciar).
//    Usar WebSockets (socket.io) o un servicio como Pusher para tiempo real.
// 6. VARIABLES DE ENTORNO: Revisar que todas las claves (JWT_SECRET, SMTP_*, etc.)
//    estén configuradas en el proveedor de hosting antes del despliegue.
// 7. MIGRACIONES: Ejecutar `npx prisma migrate deploy` en producción,
//    no `prisma db push` (que puede causar pérdida de datos).
// 8. CORS: Cambiar FRONTEND_URL en .env al dominio real de producción.
// 9. RATE LIMITING: Ajustar los límites (actualmente 10 intentos/15min en login)
//    según el tráfico real esperado.
// 10. LOGS: pino + pino-http unifican toda la observabilidad en JSON estructurado.
//     En prod redirigir el stdout a un servicio de agregación (Datadog, Logtail, Loki).
// =============================================================

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const cookieParser = require('cookie-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');
const { startScheduler } = require('./services/scheduler.service');
const { initSocket } = require('./config/socket');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const resourcesRoutes = require('./routes/resources.routes');
const resourceBookingsRoutes = require('./routes/resourceBookings.routes');
const adminRoutes = require('./routes/admin.routes');
const discountCodesRoutes = require('./routes/discountCodes.routes');
const notificationsRoutes = require('./routes/notifications.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const { publicRouter: businessesRoutes, adminRouter: adminBusinessesRoutes } = require('./routes/business.routes');

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.io — debe inicializarse antes de app.listen
initSocket(httpServer);

// =============================================
// RATE LIMITING
// =============================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 10 : 1000,
  message: { success: false, message: 'Demasiados intentos de login. Inténtalo de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: { success: false, message: 'Demasiadas solicitudes de recuperación. Inténtalo de nuevo en 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// =============================================
// MIDDLEWARE GLOBAL
// =============================================
// Helmet con CSP afinada: la default-policy de helmet bloquea recursos externos
// indispensables para el funcionamiento de la app (imágenes Cloudinary, tiles del
// mapa Leaflet/OSM, iconos por marker via unpkg). Mantenemos la base de helmet y
// abrimos solo los orígenes estrictamente necesarios.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": [
        "'self'",
        "data:",
        "blob:",
        "https://res.cloudinary.com",
        "https://*.tile.openstreetmap.org",
        "https://unpkg.com",
      ],
      "script-src": [
        "'self'",
        "https://unpkg.com",
      ],
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "https://unpkg.com",
      ],
      "font-src": ["'self'", "data:"],
      "connect-src": [
        "'self'",
        "https://nominatim.openstreetmap.org",
      ],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
// Logging HTTP estructurado sobre la misma instancia de pino (req-id auto, nivel
// rebajado para 4xx y silenciado para health checks que ensucian el log).
app.use(pinoHttp({
  logger,
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// =============================================
// RUTAS
// =============================================

// Swagger UI (solo en desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Health check — público, sin auth. Usado por load balancers y monitorización.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: parseFloat(process.uptime().toFixed(2)),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: require('../package.json').version,
  });
});

// API routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', forgotPasswordLimiter);
app.use('/api/auth/resend-verification', forgotPasswordLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/resource-bookings', resourceBookingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/discount-codes', discountCodesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/businesses', businessesRoutes);
app.use('/api/admin/businesses', adminBusinessesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Error handler (debe ir último)
app.use(errorHandler);

// =============================================
// ARRANQUE DEL SERVIDOR
// =============================================
// En tests no arrancamos el listener: supertest crea su propio servidor efímero
// a partir del objeto `app`. Esto también evita EADDRINUSE entre suites paralelas.
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, async () => {
    startScheduler();
    logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'API servidor arrancado');
  });
}

module.exports = app;


