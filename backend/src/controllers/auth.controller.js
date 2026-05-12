const crypto = require('crypto');
const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { sendPasswordReset, sendEmailVerification, sendWelcomeEmail } = require('../services/email.service');
const { uploadFile, deleteFile } = require('../config/storage');
const logger = require('../config/logger');

const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? 'strict' : 'lax',
  maxAge: 15 * 60 * 1000, // Access token: 15 min
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000, // Refresh token: 7 days
  path: '/api/auth/refresh', // Solo se envía al endpoint de refresco
};

/**
 * Genera un token de verificación, lo guarda hasheado en BD (24h) y dispara el email.
 * Aislado para reutilizarlo desde register y resendVerification.
 */
async function issueVerificationToken(usuario) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expira = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await prisma.emailVerificationToken.upsert({
    where: { usuario_id: usuario.id },
    update: { token: hashedToken, expira_at: expira },
    create: { usuario_id: usuario.id, token: hashedToken, expira_at: expira },
  });

  // El backend procesa el click y redirige al frontend; en prod Nginx enruta /api/*.
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/api/auth/verify-email?token=${rawToken}`;
  sendEmailVerification(usuario, verifyUrl)
    .catch((err) => logger.error({ err }, 'Error enviando email de verificación'));
}

/**
 * POST /api/auth/register
 * La cuenta queda inactiva hasta que el usuario verifica su email.
 * No se devuelve cookie de sesión: forzamos el flujo verificar → login.
 */
async function register(req, res, next) {
  try {
    const { nombre, apellidos, email, password, telefono } = req.body;

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una cuenta con ese email',
      });
    }

    const hashedPassword = await hashPassword(password);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellidos,
        email,
        password: hashedPassword,
        telefono: telefono || null,
        rol: 'CLIENTE',
      },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        telefono: true,
        rol: true,
        created_at: true,
      },
    });

    await issueVerificationToken(usuario);

    res.status(201).json({
      success: true,
      message: 'Cuenta creada. Te hemos enviado un email para verificar tu dirección. Revisa tu bandeja antes de iniciar sesión.',
      data: { usuario },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Cuenta suspendida. Contacta con el administrador.',
        motivo: usuario.motivo_suspension || null,
      });
    }

    if (!usuario.email_verificado) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja o solicita un nuevo enlace.',
      });
    }

    const isValid = await comparePassword(password, usuario.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      });
    }

    const accessToken = generateToken(usuario);
    const refreshToken = generateRefreshToken(usuario);
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await prisma.refreshToken.create({
      data: {
        usuario_id: usuario.id,
        token_hash: refreshTokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.cookie('token', accessToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({
      success: true,
      data: {
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellidos: usuario.apellidos,
          email: usuario.email,
          telefono: usuario.telefono,
          rol: usuario.rol,
          avatar_url: usuario.avatar_url,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.updateMany({
      where: { token_hash: hash },
      data: { revoked_at: new Date() },
    }).catch(() => {});
  }

  res.clearCookie('token', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ success: true, message: 'Sesión cerrada' });
}

/**
 * POST /api/auth/refresh
 */
async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'No refresh token' });

    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token_hash: hash },
      include: { usuario: { include: { business: true } } },
    });

    if (!storedToken || storedToken.revoked_at || storedToken.expires_at < new Date()) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }

    // Rotación: invalidamos el viejo y creamos uno nuevo
    const newAccessToken = generateToken(storedToken.usuario);
    const newRefreshToken = generateRefreshToken(storedToken.usuario);
    const newHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await prisma.$transaction([
      prisma.refreshToken.update({ where: { id: storedToken.id }, data: { revoked_at: new Date() } }),
      prisma.refreshToken.create({
        data: {
          usuario_id: storedToken.usuario_id,
          token_hash: newHash,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    res.cookie('token', newAccessToken, COOKIE_OPTIONS);
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    res.json({ success: true });
  } catch (error) { next(error); }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        telefono: true,
        rol: true,
        avatar_url: true,
        created_at: true,
      },
    });

    res.json({ success: true, data: usuario });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/auth/profile
 */
async function updateProfile(req, res, next) {
  try {
    const { nombre, apellidos, telefono } = req.body;

    const usuario = await prisma.usuario.update({
      where: { id: req.user.id },
      data: {
        ...(nombre && { nombre }),
        ...(apellidos && { apellidos }),
        ...(telefono !== undefined && { telefono }),
      },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        telefono: true,
        rol: true,
        avatar_url: true,
      },
    });

    res.json({
      success: true,
      message: 'Perfil actualizado',
      data: usuario,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/export — Exportar todos los datos del usuario (RGPD)
 */
async function exportUserData(req, res, next) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      include: {
        citas: {
          include: {
            servicio: { select: { nombre: true, precio: true } },
            empleado: { select: { nombre: true, apellidos: true } },
          },
        },
        reservas_recurso: {
          include: { recurso: { select: { nombre: true, tipo: true, precio_hora: true } } },
        },
      },
    });

    if (!usuario) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    // Mapeo a DTO amigable para el usuario (limpieza de IDs y campos técnicos)
    const exportData = {
      perfil: {
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        email: usuario.email,
        telefono: usuario.telefono,
        fecha_registro: usuario.created_at,
      },
      citas: usuario.citas.map(c => ({
        fecha: c.fecha,
        hora: `${c.hora_inicio} - ${c.hora_fin}`,
        servicio: c.servicio.nombre,
        precio: c.precio_pagado || c.servicio.precio,
        empleado: `${c.empleado.nombre} ${c.empleado.apellidos}`,
        estado: c.estado,
      })),
      reservas_recursos: usuario.reservas_recurso.map(r => ({
        fecha: r.fecha,
        hora: `${r.hora_inicio} - ${r.hora_fin}`,
        recurso: r.recurso.nombre,
        tipo: r.recurso.tipo,
        precio: r.precio_pagado || r.recurso.precio_hora,
        estado: r.estado,
      })),
    };

    res.setHeader('Content-Disposition', 'attachment; filename="mis-datos.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json({
      mensaje: 'Este archivo contiene todos tus datos personales y actividad en nuestra plataforma (Derecho a la Portabilidad RGPD)',
      exportado_el: new Date().toISOString(),
      datos: exportData
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/auth/change-password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { id: req.user.id } });
    const isValid = await comparePassword(currentPassword, usuario.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'La contraseña actual no es correcta' });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.usuario.update({ where: { id: req.user.id }, data: { password: hashed } });

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    // Siempre respondemos 200 para no revelar si el email existe
    if (!usuario) {
      return res.json({ success: true, message: 'Si el email existe, recibirás un enlace en breve' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.passwordResetToken.upsert({
      where: { usuario_id: usuario.id },
      update: { token: hashedToken, expira_at: expira },
      create: { usuario_id: usuario.id, token: hashedToken, expira_at: expira },
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;
    sendPasswordReset(usuario, resetUrl)
      .catch((err) => logger.error({ err }, 'Error enviando email de reset'));

    res.json({ success: true, message: 'Si el email existe, recibirás un enlace en breve' });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token: hashedToken } });

    if (!resetToken || resetToken.expira_at < new Date()) {
      return res.status(400).json({ success: false, message: 'Token inválido o expirado' });
    }

    const hashedPassword = await hashPassword(password);

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: resetToken.usuario_id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.delete({ where: { token: hashedToken } }),
    ]);

    res.json({ success: true, message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/verify-email?token=<rawToken>
 * Activa la cuenta y redirige al frontend con un query param que el login puede leer.
 * Devolvemos siempre redirect (no JSON) porque el usuario llega aquí desde un link de email.
 */
async function verifyEmail(req, res) {
  const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.redirect(`${FRONTEND}/login?verify=missing`);
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const record = await prisma.emailVerificationToken.findUnique({ where: { token: hashedToken } });

    if (!record || record.expira_at < new Date()) {
      return res.redirect(`${FRONTEND}/login?verify=expired`);
    }

    const [activatedUser] = await prisma.$transaction([
      prisma.usuario.update({
        where: { id: record.usuario_id },
        data: { email_verificado: true },
        // select is not supported inside transaction array form — fetched separately below
      }),
      prisma.emailVerificationToken.delete({ where: { token: hashedToken } }),
    ]);

    // Fire-and-forget welcome email — no bloquea la redirección
    sendWelcomeEmail(activatedUser)
      .catch((err) => logger.error({ err }, 'Error enviando email de bienvenida'));

    return res.redirect(`${FRONTEND}/login?verify=ok`);
  } catch (error) {
    logger.error({ err: error }, 'Error verificando email');
    return res.redirect(`${FRONTEND}/login?verify=error`);
  }
}

/**
 * POST /api/auth/resend-verification
 * Permite reemitir el email de verificación si el original expiró o se perdió.
 * Respuesta uniforme (no revela si el email existe) — mismo patrón que forgotPassword.
 */
async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;
    const respuesta = { success: true, message: 'Si el email existe y aún no está verificado, recibirás un nuevo enlace.' };

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || usuario.email_verificado) {
      return res.json(respuesta);
    }

    await issueVerificationToken(usuario);
    res.json(respuesta);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/avatar
 */
async function uploadAvatar(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió ningún archivo' });
    }

    const currentUser = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: { avatar_url: true },
    });

    // Borrar avatar anterior si existe (fire-and-forget, no bloquea la respuesta)
    if (currentUser?.avatar_url) {
      deleteFile(currentUser.avatar_url);
    }

    const avatarUrl = await uploadFile(req.file.buffer, req.file.originalname, 'avatars');

    const usuario = await prisma.usuario.update({
      where: { id: req.user.id },
      data: { avatar_url: avatarUrl },
      select: { id: true, nombre: true, apellidos: true, email: true, telefono: true, rol: true, avatar_url: true },
    });

    res.json({ success: true, message: 'Avatar actualizado', data: usuario });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, logout, refresh, getMe, updateProfile, changePassword, uploadAvatar, exportUserData, forgotPassword, resetPassword, verifyEmail, resendVerification };
