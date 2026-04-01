require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { errorHandler } = require('./middleware/errorHandler');
const { ensureUploadDir, UPLOAD_DIR } = require('./config/storage');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const servicesRoutes = require('./routes/services.routes');
const employeesRoutes = require('./routes/employees.routes');
const availabilityRoutes = require('./routes/availability.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const resourcesRoutes = require('./routes/resources.routes');
const resourceBookingsRoutes = require('./routes/resourceBookings.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
// MIDDLEWARE GLOBAL
// =============================================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos subidos
app.use('/uploads', express.static(UPLOAD_DIR));

// =============================================
// RUTAS
// =============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Sistema de Reservas — Funcionando ✅',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/resource-bookings', resourceBookingsRoutes);
app.use('/api/admin', adminRoutes);

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
app.listen(PORT, async () => {
  console.log('');
  console.log('🚀 ══════════════════════════════════════════');
  console.log(`   Sistema de Reservas — API Server`);
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log('══════════════════════════════════════════ 🚀');
  console.log('');

  // Crear carpetas de uploads
  ensureUploadDir();
});

module.exports = app;
