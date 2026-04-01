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
    update: {},
    create: {
      nombre: 'Admin',
      apellidos: 'Sistema',
      email: 'admin@reservas.local',
      password: adminPassword,
      telefono: '+34600000001',
      rol: 'ADMIN',
      activo: true,
    },
  });

  const cliente = await prisma.usuario.upsert({
    where: { email: 'cliente@reservas.local' },
    update: {},
    create: {
      nombre: 'María',
      apellidos: 'García López',
      email: 'cliente@reservas.local',
      password: clientePassword,
      telefono: '+34600000002',
      rol: 'CLIENTE',
      activo: true,
    },
  });

  const cliente2 = await prisma.usuario.upsert({
    where: { email: 'carlos@reservas.local' },
    update: {},
    create: {
      nombre: 'Carlos',
      apellidos: 'Martínez Ruiz',
      email: 'carlos@reservas.local',
      password: clientePassword,
      telefono: '+34600000003',
      rol: 'CLIENTE',
      activo: true,
    },
  });

  console.log('✅ Usuarios creados');

  // =============================================
  // EMPLEADOS (Peluquería)
  // =============================================
  const empleados = await Promise.all([
    prisma.empleado.upsert({
      where: { email: 'ana.peluquera@reservas.local' },
      update: {},
      create: {
        nombre: 'Ana',
        apellidos: 'Rodríguez Sánchez',
        email: 'ana.peluquera@reservas.local',
        telefono: '+34600100001',
        especialidad: 'Coloración y Mechas',
        activo: true,
      },
    }),
    prisma.empleado.upsert({
      where: { email: 'pedro.barbero@reservas.local' },
      update: {},
      create: {
        nombre: 'Pedro',
        apellidos: 'Fernández Díaz',
        email: 'pedro.barbero@reservas.local',
        telefono: '+34600100002',
        especialidad: 'Barbería y Corte Masculino',
        activo: true,
      },
    }),
    prisma.empleado.upsert({
      where: { email: 'laura.estilista@reservas.local' },
      update: {},
      create: {
        nombre: 'Laura',
        apellidos: 'Moreno Jiménez',
        email: 'laura.estilista@reservas.local',
        telefono: '+34600100003',
        especialidad: 'Peinados y Tratamientos',
        activo: true,
      },
    }),
  ]);

  console.log('✅ Empleados creados');

  // =============================================
  // SERVICIOS (Peluquería)
  // =============================================
  const servicios = await Promise.all([
    prisma.servicio.create({
      data: {
        nombre: 'Corte de pelo',
        descripcion: 'Corte personalizado según tendencias actuales',
        duracion_min: 30,
        precio: 15.00,
        categoria: 'Corte',
        activo: true,
      },
    }),
    prisma.servicio.create({
      data: {
        nombre: 'Coloración completa',
        descripcion: 'Tinte completo con productos profesionales',
        duracion_min: 90,
        precio: 45.00,
        categoria: 'Color',
        activo: true,
      },
    }),
    prisma.servicio.create({
      data: {
        nombre: 'Mechas / Balayage',
        descripcion: 'Mechas naturales con técnica balayage',
        duracion_min: 120,
        precio: 65.00,
        categoria: 'Color',
        activo: true,
      },
    }),
    prisma.servicio.create({
      data: {
        nombre: 'Barba completa',
        descripcion: 'Recorte y perfilado de barba con navaja',
        duracion_min: 20,
        precio: 10.00,
        categoria: 'Barbería',
        activo: true,
      },
    }),
    prisma.servicio.create({
      data: {
        nombre: 'Lavado + Peinado',
        descripcion: 'Lavado con masaje capilar y peinado profesional',
        duracion_min: 45,
        precio: 20.00,
        categoria: 'Peinado',
        activo: true,
      },
    }),
    prisma.servicio.create({
      data: {
        nombre: 'Tratamiento Keratina',
        descripcion: 'Alisado con keratina para cabello liso y brillante',
        duracion_min: 150,
        precio: 80.00,
        categoria: 'Tratamiento',
        activo: true,
      },
    }),
  ]);

  console.log('✅ Servicios creados');

  // =============================================
  // SERVICIOS ↔ EMPLEADOS (relación N:M)
  // =============================================
  const asignaciones = [
    // Ana: Coloración, Mechas, Lavado+Peinado, Tratamiento
    { servicio_id: servicios[1].id, empleado_id: empleados[0].id },
    { servicio_id: servicios[2].id, empleado_id: empleados[0].id },
    { servicio_id: servicios[4].id, empleado_id: empleados[0].id },
    { servicio_id: servicios[5].id, empleado_id: empleados[0].id },
    // Pedro: Corte, Barba
    { servicio_id: servicios[0].id, empleado_id: empleados[1].id },
    { servicio_id: servicios[3].id, empleado_id: empleados[1].id },
    // Laura: Corte, Lavado+Peinado, Tratamiento
    { servicio_id: servicios[0].id, empleado_id: empleados[2].id },
    { servicio_id: servicios[4].id, empleado_id: empleados[2].id },
    { servicio_id: servicios[5].id, empleado_id: empleados[2].id },
  ];

  for (const asig of asignaciones) {
    await prisma.servicioEmpleado.create({ data: asig });
  }

  console.log('✅ Asignaciones servicio-empleado creadas');

  // =============================================
  // DISPONIBILIDAD (Horarios semanales)
  // =============================================
  // Lunes a Viernes, 09:00-14:00 y 16:00-20:00
  for (const empleado of empleados) {
    for (let dia = 0; dia <= 4; dia++) {
      await prisma.disponibilidad.createMany({
        data: [
          { empleado_id: empleado.id, dia_semana: dia, hora_inicio: '09:00', hora_fin: '14:00' },
          { empleado_id: empleado.id, dia_semana: dia, hora_inicio: '16:00', hora_fin: '20:00' },
        ],
      });
    }
    // Sábado mañana
    await prisma.disponibilidad.create({
      data: { empleado_id: empleado.id, dia_semana: 5, hora_inicio: '09:00', hora_fin: '14:00' },
    });
  }

  console.log('✅ Disponibilidades creadas');

  // =============================================
  // CITAS DE EJEMPLO
  // =============================================
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // Ensure it's a weekday
  while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }

  await prisma.cita.createMany({
    data: [
      {
        usuario_id: cliente.id,
        empleado_id: empleados[1].id,
        servicio_id: servicios[0].id,
        fecha: tomorrow,
        hora_inicio: '10:00',
        hora_fin: '10:30',
        estado: 'CONFIRMADA',
        notas: 'Corte degradado por los lados',
      },
      {
        usuario_id: cliente2.id,
        empleado_id: empleados[0].id,
        servicio_id: servicios[1].id,
        fecha: tomorrow,
        hora_inicio: '11:00',
        hora_fin: '12:30',
        estado: 'PENDIENTE',
      },
    ],
  });

  console.log('✅ Citas de ejemplo creadas');

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
        descripcion: 'Mesa individual junto a ventana',
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
        descripcion: 'Sala pequeña para reuniones privadas o llamadas',
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
        descripcion: 'Puesto fijo con almacenamiento personal',
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
  // RESERVAS DE RECURSOS DE EJEMPLO
  // =============================================
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

  console.log('✅ Reservas de recursos de ejemplo creadas');
  console.log('');
  console.log('🎉 Seed completado exitosamente!');
  console.log('');
  console.log('📧 Cuentas de prueba:');
  console.log('   Admin:   admin@reservas.local / Admin123!');
  console.log('   Cliente: cliente@reservas.local / Cliente123!');
  console.log('   Cliente: carlos@reservas.local / Cliente123!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
