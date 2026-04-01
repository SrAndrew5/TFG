const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin123!', 12);
  await p.usuario.update({
    where: { email: 'admin@reservas.local' },
    data: { password: hash }
  });
  console.log('Admin password reset OK');
  await p.$disconnect();
}

main();
