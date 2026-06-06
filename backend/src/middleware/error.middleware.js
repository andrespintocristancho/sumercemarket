export function errorMiddleware(err, _req, res, _next) {
  console.error('❌ Error:', err.message);
  // Errores de Multer (tamaño/cantidad)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Imagen muy pesada. Máx 5MB por archivo.' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Máximo 6 imágenes por oferta.' });
  }
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Error interno del servidor'
  });
}

export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
