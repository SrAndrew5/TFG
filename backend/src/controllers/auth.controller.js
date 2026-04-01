const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { sendWelcomeEmail } = require('../services/email.service');

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { nombre, apellidos, email, password, telefono } = req.body;

    // Verificar si el email ya existe
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

    const token = generateToken(usuario);

    // Enviar email de bienvenida (async, no bloquea)
    sendWelcomeEmail(usuario);

    res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente',
      data: { usuario, token },
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
        message: 'Cuenta desactivada. Contacta con el administrador.',
      });
    }

    const isValid = await comparePassword(password, usuario.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
      });
    }

    const token = generateToken(usuario);

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
        token,
      },
    });
  } catch (error) {
    next(error);
  }
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

module.exports = { register, login, getMe, updateProfile };
