/**
 * Middleware centralizado de manejo de errores
 */
function errorHandler(err, req, res, _next) {
  console.error('❌ Error:', err);

  // Errores de Prisma
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'campo';
    return res.status(409).json({
      success: false,
      message: `Ya existe un registro con ese valor de ${field}`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Registro no encontrado',
    });
  }

  // Errores de JSON parse
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'JSON inválido en el cuerpo de la petición',
    });
  }

  // Error genérico
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'development'
    ? err.message
    : 'Error interno del servidor';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
