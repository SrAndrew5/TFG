const request = require('supertest');
const app = require('../index');
const prisma = require('../config/database');

const TEST_EMAIL = `test_${Date.now()}_${process.pid}@reservas.test`;
const TEST_PASSWORD = 'Test1234!';

// Cookie de sesión que iremos rellenando entre tests
let sessionCookie;
let userId;

afterAll(async () => {
  await prisma.usuario.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

/**
 * Helper: extrae la cookie 'token' del header Set-Cookie
 */
function extractTokenCookie(res) {
  const setCookie = res.headers['set-cookie'] || [];
  return setCookie.find((c) => c.startsWith('token=')) || null;
}

describe('POST /api/auth/register', () => {
  it('crea un usuario nuevo (cuenta queda sin verificar)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Test', apellidos: 'Usuario', email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.usuario.email).toBe(TEST_EMAIL);
    // No se debe emitir cookie en register: la cuenta no está verificada
    expect(extractTokenCookie(res)).toBeNull();
    userId = res.body.data.usuario.id;
  });

  it('rechaza email duplicado', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Test', apellidos: 'Usuario', email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(409);
  });

  it('rechaza registro sin campos obligatorios', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'incompleto@test.com' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    // Bypass del flujo de verificación: marcamos al usuario de test como verificado
    // para poder probar el resto. El test específico de email_verificado está más abajo.
    await prisma.usuario.update({
      where: { email: TEST_EMAIL },
      data: { email_verificado: true },
    });
  });

  it('emite cookie httpOnly con credenciales correctas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.usuario.email).toBe(TEST_EMAIL);

    const cookie = extractTokenCookie(res);
    expect(cookie).not.toBeNull();
    expect(cookie).toMatch(/HttpOnly/i);
    sessionCookie = cookie;
  });

  it('rechaza contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('rechaza email inexistente', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noexiste@test.com', password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });
});

describe('Login bloquea cuenta sin email_verificado', () => {
  const UNVERIFIED_EMAIL = `unverified_${Date.now()}_${process.pid}@reservas.test`;

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'No', apellidos: 'Verificado', email: UNVERIFIED_EMAIL, password: TEST_PASSWORD });
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { email: UNVERIFIED_EMAIL } });
  });

  it('devuelve 403 con code EMAIL_NOT_VERIFIED', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: UNVERIFIED_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });
});

describe('GET /api/auth/me', () => {
  it('devuelve datos del usuario autenticado vía cookie', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_EMAIL);
  });

  it('rechaza petición sin cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rechaza cookie inválida', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', 'token=tokeninvalido123');

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/auth/profile', () => {
  it('actualiza el perfil del usuario', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Cookie', sessionCookie)
      .send({ nombre: 'NombreActualizado', apellidos: 'ApellidoActualizado' });

    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('NombreActualizado');
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('responde 200 aunque el email no exista (seguridad)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'noexiste@test.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('responde 200 con email existente', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/auth/logout', () => {
  it('limpia la cookie de sesión', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'] || [];
    // clearCookie emite un Set-Cookie con la cookie en blanco/expirada
    const cleared = setCookie.find((c) => c.startsWith('token='));
    expect(cleared).toBeTruthy();
  });
});
