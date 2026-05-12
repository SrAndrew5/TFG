const { Router } = require('express');
const { register, login, logout, refresh, getMe, updateProfile, changePassword, uploadAvatar, exportUserData, forgotPassword, resetPassword, verifyEmail, resendVerification } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const upload = require('../middleware/upload');

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar nuevo usuario
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, apellidos, email, password]
 *             properties:
 *               nombre: { type: string }
 *               apellidos: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               telefono: { type: string }
 *     responses:
 *       201: { description: Usuario creado }
 *       409: { description: Email ya registrado }
 */
router.post('/register', validate(schemas.register), register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login correcto, devuelve token JWT }
 *       401: { description: Credenciales incorrectas }
 */
router.post('/login', validate(schemas.login), login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obtener usuario autenticado
 *     responses:
 *       200: { description: Datos del usuario }
 *       401: { description: Token inválido }
 */
router.get('/me', authenticate, getMe);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     tags: [Auth]
 *     summary: Actualizar perfil
 *     responses:
 *       200: { description: Perfil actualizado }
 */
router.put('/profile', authenticate, validate(schemas.updateProfile), updateProfile);
router.put('/change-password', authenticate, validate(schemas.changePassword), changePassword);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Solicitar recuperación de contraseña
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Email enviado si el usuario existe }
 */
/**
 * @swagger
 * /auth/export:
 *   get:
 *     tags: [Auth]
 *     summary: Exportar todos los datos del usuario (RGPD)
 *     responses:
 *       200: { description: JSON con todos los datos del usuario }
 */
router.get('/export', authenticate, exportUserData);

router.post('/logout', logout);
router.post('/forgot-password', validate(schemas.forgotPassword), forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Restablecer contraseña con token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Contraseña actualizada }
 *       400: { description: Token inválido o expirado }
 */
router.post('/reset-password', validate(schemas.resetPassword), resetPassword);

/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     tags: [Auth]
 *     summary: Verifica el email de una cuenta recién registrada
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       302: { description: Redirección al frontend con ?verify=ok|expired|missing|error }
 */
// No usamos validate() aquí: si el token es inválido respondemos con redirect, no JSON.
router.get('/verify-email', verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Reemite el email de verificación si la cuenta sigue sin verificar
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Respuesta uniforme (no revela si el email existe) }
 */
router.post('/resend-verification', validate(schemas.resendVerification), resendVerification);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refrescar token de acceso
 *     responses:
 *       200: { description: Token refrescado correctamente }
 *       401: { description: Refresh token inválido o expirado }
 */
router.post('/refresh', refresh);

module.exports = router;
