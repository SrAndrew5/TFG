const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const business = await prisma.business.findFirst({
    where: { nombre: 'Negocio de Prueba Final' },
    include: { citas: { include: { usuario: true, servicio: true } } }
  });

  if (!business) {
    console.log('Business not found');
    return;
  }

  console.log(`Business ID: ${business.id}`);
  console.log(`Citas count: ${business.citas.length}`);
  business.citas.forEach(c => {
    console.log(`- Cita ID: ${c.id}, Estado: ${c.estado}, Usuario: ${c.usuario.email}, Servicio: ${c.servicio.nombre}`);
  });
  
  process.exit(0);
}

check();
