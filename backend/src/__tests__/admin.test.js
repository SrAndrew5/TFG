const request = require('supertest');
const app = require('../index');
const prisma = require('../config/database');

// ─────────────────────────────────────────────
// Setup: autenticamos un admin y un cliente
// usando las cuentas del seed.
// ─────────────────────────────────────────────

let adminCookie;
let clientCookie;

function extractTokenCookie(res) {
  const setCookie = res.headers['set-cookie'] || [];
  return setCookie.find((c) => c.startsWith('token=')) || null;
}

beforeAll(async () => {
  const [adminRes, clientRes] = await Promise.all([
    request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@reservas.local', password: 'Admin123!' }),
    request(app)
      .post('/api/auth/login')
      .send({ email: 'cliente@reservas.local', password: 'Cliente123!' }),
  ]);

  adminCookie = extractTokenCookie(adminRes);
  clientCookie = extractTokenCookie(clientRes);

  // Guardabarrera: si el login falla, que los tests exploten de forma clara.
  if (!adminCookie) throw new Error('No se pudo autenticar como admin — ¿falta el seed?');
  if (!clientCookie) throw new Error('No se pudo autenticar como cliente — ¿falta el seed?');
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ═════════════════════════════════════════════
// GET /api/admin/stats
// ═════════════════════════════════════════════

describe('GET /api/admin/stats', () => {
  it('admin recibe 200 con la estructura esperada de KPIs', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { data } = res.body;

    // Verificamos que cada sección del dashboard existe
    expect(data).toHaveProperty('resumen');
    expect(data).toHaveProperty('citas');
    expect(data).toHaveProperty('reservas');
    expect(data).toHaveProperty('ingresos');

    // Resumen tiene las 4 métricas principales
    expect(data.resumen).toEqual(
      expect.objectContaining({
        total_usuarios: expect.any(Number),
        total_empleados: expect.any(Number),
        total_servicios: expect.any(Number),
        total_recursos: expect.any(Number),
      })
    );

    // Ingresos del mes como número (no NaN)
    expect(typeof data.ingresos.mes_actual).toBe('number');
    expect(Number.isNaN(data.ingresos.mes_actual)).toBe(false);

    // Citas hoy es un número ≥ 0
    expect(data.citas.hoy).toBeGreaterThanOrEqual(0);
  });

  it('cliente recibe 403 (prohibido)', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('sin autenticación recibe 401', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });
});

// ═════════════════════════════════════════════
// GET /api/admin/users
// ═════════════════════════════════════════════

describe('GET /api/admin/users', () => {
  it('admin puede listar usuarios con datos esperados', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);

    // Cada usuario tiene los campos que el frontend necesita
    const user = res.body.data[0];
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('nombre');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('rol');
    expect(user).toHaveProperty('activo');
    expect(user).toHaveProperty('total_citas');
    expect(user).toHaveProperty('total_reservas');

    // No se expone el password
    expect(user).not.toHaveProperty('password');
  });

  it('soporta paginación', async () => {
    const res = await request(app)
      .get('/api/admin/users?page=1&limit=2')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(2);
    expect(res.body.data.length).toBeLessThanOrEqual(2);
  });

  it('soporta filtro por rol', async () => {
    const res = await request(app)
      .get('/api/admin/users?rol=ADMIN')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    // Todos los resultados deben tener rol ADMIN
    res.body.data.forEach((u) => {
      expect(u.rol).toBe('ADMIN');
    });
  });

  it('cliente recibe 403', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(403);
  });
});

// ═════════════════════════════════════════════
// PUT /api/admin/users/:id/toggle
// ═════════════════════════════════════════════

describe('PUT /api/admin/users/:id/toggle', () => {
  let toggleUserId;

  beforeAll(async () => {
    // Creamos un usuario sacrificable para el toggle sin afectar al seed
    const { hashPassword } = require('../utils/hash');
    const hashed = await hashPassword('Test1234!');
    const toggleUser = await prisma.usuario.create({
      data: {
        nombre: 'Toggle',
        apellidos: 'Test',
        email: `toggle_${Date.now()}_${process.pid}@reservas.test`,
        password: hashed,
        email_verificado: true,
      },
    });
    toggleUserId = toggleUser.id;
  });

  afterAll(async () => {
    if (toggleUserId) {
      await prisma.usuario.deleteMany({ where: { id: toggleUserId } });
    }
  });

  it('admin puede desactivar un usuario', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${toggleUserId}/toggle`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.activo).toBe(false);
  });

  it('admin puede reactivar al mismo usuario', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${toggleUserId}/toggle`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.activo).toBe(true);
  });

  it('admin no puede desactivarse a sí mismo (anti-lockout)', async () => {
    // Obtenemos el ID del admin logueado
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', adminCookie);
    const adminId = meRes.body.data.id;

    const res = await request(app)
      .put(`/api/admin/users/${adminId}/toggle`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/propia/i);
  });

  it('cliente recibe 403 al intentar toggle', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${toggleUserId}/toggle`)
      .set('Cookie', clientCookie);

    expect(res.status).toBe(403);
  });
});
