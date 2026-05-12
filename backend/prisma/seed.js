const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // =============================================
  // USUARIOS
  // =============================================
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const clientePassword = await bcrypt.hash('Cliente123!', 12);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@reservas.local' },
    update: { email_verificado: true, activo: true },
    create: {
      nombre: 'Admin',
      apellidos: 'Sistema',
      email: 'admin@reservas.local',
      password: adminPassword,
      telefono: '+34600000001',
      rol: 'ADMIN',
      activo: true,
      email_verificado: true,
    },
  });

  const cliente = await prisma.usuario.upsert({
    where: { email: 'cliente@reservas.local' },
    update: { email_verificado: true, activo: true },
    create: {
      nombre: 'María',
      apellidos: 'García López',
      email: 'cliente@reservas.local',
      password: clientePassword,
      telefono: '+34600000002',
      rol: 'CLIENTE',
      activo: true,
      email_verificado: true,
    },
  });

  const cliente2 = await prisma.usuario.upsert({
    where: { email: 'carlos@reservas.local' },
    update: { email_verificado: true, activo: true },
    create: {
      nombre: 'Carlos',
      apellidos: 'Martínez Ruiz',
      email: 'carlos@reservas.local',
      password: clientePassword,
      telefono: '+34600000003',
      rol: 'CLIENTE',
      activo: true,
      email_verificado: true,
    },
  });

  console.log('✅ Usuarios creados');

  // =============================================
  // RECURSOS (Coworking)
  // =============================================
  const recursos = await Promise.all([
    prisma.recurso.create({
      data: {
        nombre: 'Mesa Hot Desk A1',
        tipo: 'MESA',
        descripcion: 'Mesa individual en zona abierta con buena iluminación natural',
        capacidad: 1,
        ubicacion: 'Planta 1, Zona A',
        precio_hora: 5.00,
        equipamiento: 'Monitor externo, Regleta, WiFi 6',
        activo: true,
      },
    }),
    prisma.recurso.create({
      data: {
        nombre: 'Mesa Hot Desk A2',
        tipo: 'MESA',
        descripcion: 'Mesa individual junto a ventana con vistas a la calle',
        capacidad: 1,
        ubicacion: 'Planta 1, Zona A',
        precio_hora: 5.00,
        equipamiento: 'Regleta, WiFi 6',
        activo: true,
      },
    }),
    prisma.recurso.create({
      data: {
        nombre: 'Sala Reuniones "Innovación"',
        tipo: 'SALA',
        descripcion: 'Sala de reuniones para equipos medianos con proyector y pizarra',
        capacidad: 8,
        ubicacion: 'Planta 2, Sala 201',
        precio_hora: 20.00,
        equipamiento: 'Proyector 4K, Pizarra, Videoconferencia, WiFi 6',
        activo: true,
      },
    }),
    prisma.recurso.create({
      data: {
        nombre: 'Sala Reuniones "Focus"',
        tipo: 'SALA',
        descripcion: 'Sala pequeña para reuniones privadas o llamadas de trabajo',
        capacidad: 4,
        ubicacion: 'Planta 2, Sala 202',
        precio_hora: 12.00,
        equipamiento: 'Pantalla TV, Videoconferencia, WiFi 6',
        activo: true,
      },
    }),
    prisma.recurso.create({
      data: {
        nombre: 'Despacho Privado D1',
        tipo: 'DESPACHO',
        descripcion: 'Despacho privado con cerradura, ideal para trabajo concentrado',
        capacidad: 2,
        ubicacion: 'Planta 1, Zona B',
        precio_hora: 15.00,
        equipamiento: 'Monitor doble, Impresora, WiFi 6, Aire acondicionado',
        activo: true,
      },
    }),
    prisma.recurso.create({
      data: {
        nombre: 'Puesto Dedicado B1',
        tipo: 'PUESTO',
        descripcion: 'Puesto fijo con almacenamiento personal bajo llave',
        capacidad: 1,
        ubicacion: 'Planta 1, Zona B',
        precio_hora: 8.00,
        equipamiento: 'Monitor, Cajonera personal, Regleta, WiFi 6',
        activo: true,
      },
    }),
  ]);

  console.log('✅ Recursos coworking creados');

  // =============================================
  // RESERVAS DE EJEMPLO
  // =============================================
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  while (dayAfterTomorrow.getDay() === 0 || dayAfterTomorrow.getDay() === 6) {
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  }

  await prisma.reservaRecurso.createMany({
    data: [
      {
        usuario_id: cliente.id,
        recurso_id: recursos[0].id,
        fecha: tomorrow,
        hora_inicio: '09:00',
        hora_fin: '13:00',
        estado: 'CONFIRMADA',
        notas: 'Necesito el monitor externo',
      },
      {
        usuario_id: cliente2.id,
        recurso_id: recursos[2].id,
        fecha: dayAfterTomorrow,
        hora_inicio: '10:00',
        hora_fin: '12:00',
        estado: 'PENDIENTE',
        notas: 'Reunión de equipo - 6 personas',
      },
    ],
  });

  console.log('✅ Reservas de ejemplo creadas');

  // =============================================
  // CÓDIGOS DE DESCUENTO
  // =============================================
  const codigosDescuento = [
    { codigo: 'BIENVENIDA10', porcentaje: 10, descripcion: 'Descuento de bienvenida para nuevos usuarios' },
    { codigo: 'VERANO20',     porcentaje: 20, descripcion: 'Oferta especial de verano' },
    { codigo: 'VIP30',        porcentaje: 30, descripcion: 'Descuento exclusivo para usuarios VIP', max_usos: 50 },
    { codigo: 'COWORK15',     porcentaje: 15, descripcion: 'Promoción espacios coworking' },
    { codigo: 'TFG100',       porcentaje: 100, descripcion: 'Código de demostración TFG (limitado)', max_usos: 5 },
  ];

  for (const cd of codigosDescuento) {
    await prisma.codigoDescuento.upsert({
      where: { codigo: cd.codigo },
      update: {},
      create: cd,
    });
  }

  console.log('✅ Códigos de descuento creados');

  // =============================================
  // NEGOCIOS DEMO (módulo SaaS)
  // Espacios de coworking registrados en la plataforma
  // =============================================
  function slugify(text) {
    return String(text || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  const businessOwnerPassword = await bcrypt.hash('password123', 12);

  const businesses = [
    {
      ownerData: {
        nombre: 'Laura', apellidos: 'Ruiz', email: 'info@coworkhub.com',
        telefono: '+34611111003',
      },
      data: {
        nombre: 'CoWork Hub Sevilla',
        tipo: 'COWORKING',
        cif_nif: 'B11223344',
        descripcion: 'Espacio de coworking moderno en el centro de Sevilla. Mesas flex, despachos privados y salas de reuniones equipadas.',
        direccion: 'Av. de la Constitución 24',
        ciudad: 'Sevilla',
        codigo_postal: '41004',
        lat: 37.3886,
        lng: -5.9953,
        telefono: '+34954123456',
        web: 'https://coworkhub-sevilla.es',
        logo_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop',
        fotos_urls: [
          'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
        ],
        estado: 'PENDIENTE',
        horario: {
          lunes:     { abre: '08:00', cierra: '21:00', cerrado: false },
          martes:    { abre: '08:00', cierra: '21:00', cerrado: false },
          miercoles: { abre: '08:00', cierra: '21:00', cerrado: false },
          jueves:    { abre: '08:00', cierra: '21:00', cerrado: false },
          viernes:   { abre: '08:00', cierra: '21:00', cerrado: false },
          sabado:    { abre: '10:00', cierra: '14:00', cerrado: false },
          domingo:   { cerrado: true },
        },
      },
    },
    {
      ownerData: {
        nombre: 'Marcos', apellidos: 'Vidal', email: 'info@spacemad.com',
        telefono: '+34611111006',
      },
      data: {
        nombre: 'Space Madrid Centro',
        tipo: 'COWORKING',
        cif_nif: 'B22334455',
        descripcion: 'Coworking premium en el corazón de Madrid. Zonas de trabajo abiertas, cabinas de concentración, salas de reuniones y una terraza exclusiva.',
        direccion: 'Calle Fuencarral 42',
        ciudad: 'Madrid',
        codigo_postal: '28004',
        lat: 40.4238,
        lng: -3.7008,
        telefono: '+34912345678',
        web: 'https://spacemad.es',
        logo_url: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=200&h=200&fit=crop',
        fotos_urls: [
          'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop',
        ],
        estado: 'ACTIVO',
        horario: {
          lunes:     { abre: '07:00', cierra: '22:00', cerrado: false },
          martes:    { abre: '07:00', cierra: '22:00', cerrado: false },
          miercoles: { abre: '07:00', cierra: '22:00', cerrado: false },
          jueves:    { abre: '07:00', cierra: '22:00', cerrado: false },
          viernes:   { abre: '07:00', cierra: '22:00', cerrado: false },
          sabado:    { abre: '09:00', cierra: '18:00', cerrado: false },
          domingo:   { cerrado: true },
        },
      },
    },
    {
      ownerData: {
        nombre: 'Nuria', apellidos: 'Pont', email: 'info@nexthub.com',
        telefono: '+34611111007',
      },
      data: {
        nombre: 'NextHub Barcelona',
        tipo: 'COWORKING',
        cif_nif: 'B33445566',
        descripcion: 'Espacio de innovación y coworking en el Eixample de Barcelona. Diseño minimalista, luz natural y comunidad activa de startups y freelancers.',
        direccion: 'Carrer de Provença 222',
        ciudad: 'Barcelona',
        codigo_postal: '08008',
        lat: 41.3927,
        lng: 2.1580,
        telefono: '+34931234567',
        web: 'https://nexthub-bcn.es',
        logo_url: 'https://images.unsplash.com/photo-1497366412874-3415097a27e7?w=200&h=200&fit=crop',
        fotos_urls: [
          'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600508774634-4e11d34730e2?w=800&h=600&fit=crop',
        ],
        estado: 'ACTIVO',
        horario: {
          lunes:     { abre: '08:30', cierra: '20:30', cerrado: false },
          martes:    { abre: '08:30', cierra: '20:30', cerrado: false },
          miercoles: { abre: '08:30', cierra: '20:30', cerrado: false },
          jueves:    { abre: '08:30', cierra: '20:30', cerrado: false },
          viernes:   { abre: '08:30', cierra: '20:30', cerrado: false },
          sabado:    { abre: '09:00', cierra: '14:00', cerrado: false },
          domingo:   { cerrado: true },
        },
      },
    },
    {
      ownerData: {
        nombre: 'Diego', apellidos: 'Alonso', email: 'info@werkhaus.com',
        telefono: '+34611111008',
      },
      data: {
        nombre: 'WerkHaus Valencia',
        tipo: 'COWORKING',
        cif_nif: 'B44556677',
        descripcion: 'Coworking de diseño industrial en Valencia. Altos techos, zonas de relax, cocina compartida y networking weekly cada viernes.',
        direccion: 'Calle de la Paz 8',
        ciudad: 'Valencia',
        codigo_postal: '46003',
        lat: 39.4712,
        lng: -0.3740,
        telefono: '+34961234567',
        web: 'https://werkhaus.es',
        logo_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop',
        fotos_urls: [
          'https://images.unsplash.com/photo-1574717024453-354056adb-a46e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=800&h=600&fit=crop',
        ],
        estado: 'ACTIVO',
        horario: {
          lunes:     { abre: '08:00', cierra: '20:00', cerrado: false },
          martes:    { abre: '08:00', cierra: '20:00', cerrado: false },
          miercoles: { abre: '08:00', cierra: '20:00', cerrado: false },
          jueves:    { abre: '08:00', cierra: '20:00', cerrado: false },
          viernes:   { abre: '08:00', cierra: '20:00', cerrado: false },
          sabado:    { cerrado: true },
          domingo:   { cerrado: true },
        },
      },
    },
  ];

  for (const b of businesses) {
    const owner = await prisma.usuario.upsert({
      where: { email: b.ownerData.email },
      update: { rol: 'BUSINESS_OWNER', email_verificado: true, activo: true },
      create: {
        ...b.ownerData,
        password: businessOwnerPassword,
        rol: 'BUSINESS_OWNER',
        email_verificado: true,
        activo: true,
      },
    });

    await prisma.business.upsert({
      where: { cif_nif: b.data.cif_nif },
      update: {
        logo_url:   b.data.logo_url,
        fotos_urls: b.data.fotos_urls,
      },
      create: {
        ...b.data,
        slug: slugify(b.data.nombre),
        owner_id: owner.id,
      },
    });
  }

  console.log('✅ Negocios demo creados (3 ACTIVOS, 1 PENDIENTE)');

  console.log('');
  console.log('🎉 Seed completado exitosamente!');
  console.log('');
  console.log('📧 Cuentas de prueba:');
  console.log('   Admin:   admin@reservas.local / Admin123!');
  console.log('   Cliente: cliente@reservas.local / Cliente123!');
  console.log('   Cliente: carlos@reservas.local / Cliente123!');
  console.log('');
  console.log('🏢 Cuentas BUSINESS_OWNER demo (password: password123):');
  console.log('   info@coworkhub.com  → CoWork Hub Sevilla (PENDIENTE — aprobar en panel admin)');
  console.log('   info@spacemad.com   → Space Madrid Centro (ACTIVO)');
  console.log('   info@nexthub.com    → NextHub Barcelona (ACTIVO)');
  console.log('   info@werkhaus.com   → WerkHaus Valencia (ACTIVO)');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
