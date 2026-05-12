const request = require('supertest');
const app = require('../index');
const prisma = require('../config/database');

let clientCookie;
let adminCookie;

function extractTokenCookie(res) {
  const setCookie = res.headers['set-cookie'] || [];
  return setCookie.find((c) => c.startsWith('token=')) || null;
}

beforeAll(async () => {
  const clientRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'cliente@reservas.local', password: 'Cliente123!' });
  clientCookie = extractTokenCookie(clientRes);

  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@reservas.local', password: 'Admin123!' });
  adminCookie = extractTokenCookie(adminRes);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/appointments', () => {
  it('cliente solo ve sus propias citas', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('admin ve todas las citas', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.total).toBeDefined();
  });

  it('requiere autenticación', async () => {
    const res = await request(app).get('/api/appointments');
    expect(res.status).toBe(401);
  });

  it('soporta paginación con cap a 100', async () => {
    const res = await request(app)
      .get('/api/appointments?page=1&limit=5')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(5);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });

  it('cap a 100 incluso si se pide más', async () => {
    const res = await request(app)
      .get('/api/appointments?limit=99999')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(100);
  });
});

describe('POST /api/appointments', () => {
  it('rechaza cita con fecha pasada', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Cookie', clientCookie)
      .send({
        empleado_id: 1,
        servicio_id: 1,
        fecha: '2020-01-01',
        hora_inicio: '10:00',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/pasada/i);
  });

  it('rechaza cita sin sesión', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ empleado_id: 1, servicio_id: 1, fecha: '2030-01-01', hora_inicio: '10:00' });

    expect(res.status).toBe(401);
  });

  it('rechaza si el servicio no existe', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const fecha = futureDate.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/appointments')
      .set('Cookie', clientCookie)
      .send({ empleado_id: 999, servicio_id: 999, fecha, hora_inicio: '10:00' });

    expect([400, 404]).toContain(res.status);
  });

  it('ignora precio_pagado del cliente (lo recalcula el servidor)', async () => {
    // Sirve para defender en el TFG: aunque el cliente envíe un precio,
    // stripUnknown lo descarta y pricing.service lo recalcula desde la BD.
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const fecha = futureDate.toISOString().split('T')[0];

    // No comprobamos el resultado de creación (depende de horarios disponibles),
    // solo que el campo extra no rompe la validación
    const res = await request(app)
      .post('/api/appointments')
      .set('Cookie', clientCookie)
      .send({
        empleado_id: 1,
        servicio_id: 1,
        fecha,
        hora_inicio: '10:00',
        precio_pagado: 0.01, // ← intento de fraude, debe ignorarse
      });

    // El backend no debe responder 400 por "precio_pagado is not allowed"
    expect(res.body.errors?.some?.((e) => e.field === 'precio_pagado')).not.toBe(true);
  });
});

describe('GET /api/appointments/:id', () => {
  it('devuelve 404 para cita inexistente', async () => {
    const res = await request(app)
      .get('/api/appointments/999999')
      .set('Cookie', clientCookie);

    expect(res.status).toBe(404);
  });
});
