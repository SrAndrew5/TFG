const crypto = require('crypto');
const prisma = require('../config/database');
const { hashPassword } = require('../utils/hash');
const { runTokenCleanupJob } = require('../services/scheduler.service');

const PWD = 'Test1234!';
// Sufijo único por ejecución para no chocar si el test se queda con basura
const SUFFIX = `${Date.now()}_${process.pid}`;
const EMAIL_EXPIRED = `cron_expired_${SUFFIX}@reservas.test`;
const EMAIL_FRESH   = `cron_fresh_${SUFFIX}@reservas.test`;

let userExpiredId;
let userFreshId;

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

beforeAll(async () => {
  const hashed = await hashPassword(PWD);

  const [userExpired, userFresh] = await Promise.all([
    prisma.usuario.create({
      data: { nombre: 'A', apellidos: 'Expired', email: EMAIL_EXPIRED, password: hashed, email_verificado: true },
    }),
    prisma.usuario.create({
      data: { nombre: 'B', apellidos: 'Fresh', email: EMAIL_FRESH, password: hashed, email_verificado: true },
    }),
  ]);

  userExpiredId = userExpired.id;
  userFreshId   = userFresh.id;

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const tomorrow  = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // 4 tokens: 2 expirados (deben borrarse) + 2 vigentes (deben sobrevivir)
  await Promise.all([
    prisma.passwordResetToken.create({
      data: { usuario_id: userExpiredId, token: sha(`pwd-expired-${SUFFIX}`), expira_at: yesterday },
    }),
    prisma.passwordResetToken.create({
      data: { usuario_id: userFreshId, token: sha(`pwd-fresh-${SUFFIX}`), expira_at: tomorrow },
    }),
    prisma.emailVerificationToken.create({
      data: { usuario_id: userExpiredId, token: sha(`ver-expired-${SUFFIX}`), expira_at: yesterday },
    }),
    prisma.emailVerificationToken.create({
      data: { usuario_id: userFreshId, token: sha(`ver-fresh-${SUFFIX}`), expira_at: tomorrow },
    }),
  ]);
});

afterAll(async () => {
  // El cascade de la FK borra cualquier token restante asociado a estos usuarios
  await prisma.usuario.deleteMany({
    where: { id: { in: [userExpiredId, userFreshId].filter(Boolean) } },
  });
  await prisma.$disconnect();
});

describe('runTokenCleanupJob', () => {
  it('borra los tokens cuyo expira_at < now y conserva los vigentes', async () => {
    await runTokenCleanupJob();

    const [pwdExp, pwdFre, verExp, verFre] = await Promise.all([
      prisma.passwordResetToken.findUnique({ where: { usuario_id: userExpiredId } }),
      prisma.passwordResetToken.findUnique({ where: { usuario_id: userFreshId } }),
      prisma.emailVerificationToken.findUnique({ where: { usuario_id: userExpiredId } }),
      prisma.emailVerificationToken.findUnique({ where: { usuario_id: userFreshId } }),
    ]);

    // Los expirados deben haber desaparecido
    expect(pwdExp).toBeNull();
    expect(verExp).toBeNull();

    // Los vigentes deben seguir ahí
    expect(pwdFre).not.toBeNull();
    expect(verFre).not.toBeNull();
  });

  it('es idempotente: una segunda ejecución no rompe ni afecta a los vigentes', async () => {
    await runTokenCleanupJob();

    const [pwdFre, verFre] = await Promise.all([
      prisma.passwordResetToken.findUnique({ where: { usuario_id: userFreshId } }),
      prisma.emailVerificationToken.findUnique({ where: { usuario_id: userFreshId } }),
    ]);

    expect(pwdFre).not.toBeNull();
    expect(verFre).not.toBeNull();
  });
});
