const prisma = require('../config/database');
const { hashPassword } = require('../utils/hash');
const { runReviewRequestJob } = require('../services/scheduler.service');

const SUFFIX = `${Date.now()}_${process.pid}`;
const EMAIL  = `rev_req_${SUFFIX}@reservas.test`;

let userId;
let serviceId;
let employeeId;
let citaEligibleId;        // hora_fin hace 2h → debe recibir notificación
let citaTooRecentId;       // hora_fin hace 30min → todavía no
let citaAlreadySentId;     // ya marcada → no duplicar
let citaCanceladaId;       // CANCELADA → ignorar

beforeAll(async () => {
  // Usuario de prueba (verificado para no chocar con el flow auth)
  const password = await hashPassword('Test1234!');
  const user = await prisma.usuario.create({
    data: { nombre: 'Test', apellidos: 'Review', email: EMAIL, password, email_verificado: true },
  });
  userId = user.id;

  // Reusamos servicio + empleado del seed (asumimos ID 1 existe). Si no, los creamos.
  const seededService = await prisma.servicio.findFirst({ where: { activo: true } });
  serviceId = seededService.id;
  const seededEmp = await prisma.empleado.findFirst({ where: { activo: true } });
  employeeId = seededEmp.id;

  // Helpers TZ-aware: derivamos fecha + hora_fin desde un timestamp objetivo en LOCAL,
  // de modo que el test funcione cerca de medianoche sin asumir que "hoy" cubre todo.
  const pad = (n) => String(n).padStart(2, '0');
  const buildFechaHora = (date) => ({
    fecha: new Date(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`),
    hora_fin: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    hora_inicio: (() => {
      const h = new Date(date.getTime() - 30 * 60 * 1000);
      return `${pad(h.getHours())}:${pad(h.getMinutes())}`;
    })(),
  });

  const now      = new Date();
  const minus2h  = buildFechaHora(new Date(now.getTime() - 2 * 3600 * 1000));   // ELIGIBLE
  const minus30m = buildFechaHora(new Date(now.getTime() - 30 * 60 * 1000));    // muy reciente

  const baseCita = {
    usuario_id: userId,
    empleado_id: employeeId,
    servicio_id: serviceId,
  };

  const citaEligible = await prisma.cita.create({
    data: { ...baseCita, ...minus2h, estado: 'COMPLETADA' },
  });
  citaEligibleId = citaEligible.id;

  const citaTooRecent = await prisma.cita.create({
    data: { ...baseCita, ...minus30m, estado: 'COMPLETADA' },
  });
  citaTooRecentId = citaTooRecent.id;

  const citaAlreadySent = await prisma.cita.create({
    data: { ...baseCita, ...minus2h, estado: 'COMPLETADA', review_request_sent_at: new Date() },
  });
  citaAlreadySentId = citaAlreadySent.id;

  const citaCancelada = await prisma.cita.create({
    data: { ...baseCita, ...minus2h, estado: 'CANCELADA' },
  });
  citaCanceladaId = citaCancelada.id;
});

afterAll(async () => {
  await prisma.usuario.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('runReviewRequestJob', () => {
  it('crea notificación y marca review_request_sent_at solo en citas elegibles', async () => {
    await runReviewRequestJob();

    const [eligible, tooRecent, alreadySent, cancelada] = await Promise.all([
      prisma.cita.findUnique({ where: { id: citaEligibleId } }),
      prisma.cita.findUnique({ where: { id: citaTooRecentId } }),
      prisma.cita.findUnique({ where: { id: citaAlreadySentId } }),
      prisma.cita.findUnique({ where: { id: citaCanceladaId } }),
    ]);

    expect(eligible.review_request_sent_at).not.toBeNull();
    expect(tooRecent.review_request_sent_at).toBeNull();
    expect(alreadySent.review_request_sent_at).not.toBeNull(); // ya estaba, sigue
    expect(cancelada.review_request_sent_at).toBeNull();

    // Verificamos que se creó exactamente UNA notificación de tipo 'review' para el user
    const reviewNotifs = await prisma.notification.findMany({
      where: { usuario_id: userId, type: 'review' },
    });
    expect(reviewNotifs).toHaveLength(1);
  });

  it('idempotente: una segunda ejecución no genera duplicados', async () => {
    await runReviewRequestJob();
    const reviewNotifs = await prisma.notification.findMany({
      where: { usuario_id: userId, type: 'review' },
    });
    expect(reviewNotifs).toHaveLength(1);
  });
});
