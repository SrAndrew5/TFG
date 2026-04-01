const prisma = require('../config/database');

/**
 * GET /api/admin/stats
 */
async function getStats(req, res, next) {
  try {
    const [
      totalUsuarios,
      totalEmpleados,
      totalServicios,
      totalRecursos,
      citasPorEstado,
      reservasPorEstado,
      citasHoy,
      reservasHoy,
      ingresosCitasMes,
    ] = await Promise.all([
      prisma.usuario.count({ where: { activo: true } }),
      prisma.empleado.count({ where: { activo: true } }),
      prisma.servicio.count({ where: { activo: true } }),
      prisma.recurso.count({ where: { activo: true } }),
      prisma.cita.groupBy({
        by: ['estado'],
        _count: { id: true },
      }),
      prisma.reservaRecurso.groupBy({
        by: ['estado'],
        _count: { id: true },
      }),
      prisma.cita.count({
        where: {
          fecha: {
            gte: new Date(new Date().toISOString().split('T')[0]),
            lt: new Date(new Date(Date.now() + 86400000).toISOString().split('T')[0]),
          },
          estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
        },
      }),
      prisma.reservaRecurso.count({
        where: {
          fecha: {
            gte: new Date(new Date().toISOString().split('T')[0]),
            lt: new Date(new Date(Date.now() + 86400000).toISOString().split('T')[0]),
          },
          estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
        },
      }),
      prisma.cita.findMany({
        where: {
          estado: 'COMPLETADA',
          fecha: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        include: { servicio: { select: { precio: true } } },
      }),
    ]);

    const ingresosMes = ingresosCitasMes.reduce(
      (sum, cita) => sum + parseFloat(cita.servicio.precio),
      0
    );

    res.json({
      success: true,
      data: {
        resumen: {
          total_usuarios: totalUsuarios,
          total_empleados: totalEmpleados,
          total_servicios: totalServicios,
          total_recursos: totalRecursos,
        },
        citas: {
          por_estado: Object.fromEntries(
            citasPorEstado.map((c) => [c.estado, c._count.id])
          ),
          hoy: citasHoy,
        },
        reservas: {
          por_estado: Object.fromEntries(
            reservasPorEstado.map((r) => [r.estado, r._count.id])
          ),
          hoy: reservasHoy,
        },
        ingresos: {
          mes_actual: ingresosMes,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users
 */
async function getUsers(req, res, next) {
  try {
    const { rol, activo } = req.query;
    const where = {};
    if (rol) where.rol = rol;
    if (activo !== undefined) where.activo = activo === 'true';

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        email: true,
        telefono: true,
        rol: true,
        activo: true,
        created_at: true,
        _count: {
          select: { citas: true, reservas_recurso: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = usuarios.map((u) => ({
      ...u,
      total_citas: u._count.citas,
      total_reservas: u._count.reservas_recurso,
      _count: undefined,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/admin/users/:id/toggle — Activar/desactivar usuario
 */
async function toggleUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.usuario.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const updated = await prisma.usuario.update({
      where: { id: userId },
      data: { activo: !user.activo },
    });

    res.json({
      success: true,
      message: `Usuario ${updated.activo ? 'activado' : 'desactivado'}`,
      data: { id: updated.id, activo: updated.activo },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getStats, getUsers, toggleUser };
