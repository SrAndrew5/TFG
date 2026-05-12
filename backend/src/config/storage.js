const crypto = require('crypto');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

const ROOT_FOLDER = process.env.CLOUDINARY_FOLDER || 'reservas-tfg';

/**
 * Sube un archivo a Cloudinary desde un Buffer en memoria.
 * Compatible con multer.memoryStorage() — el controller no cambia más allá del `await`.
 *
 * @param {Buffer} fileBuffer  - Contenido del archivo (req.file.buffer)
 * @param {string} originalName - Nombre original (no se usa para nombrar, solo aceptado por compat)
 * @param {string} folder       - Subcarpeta lógica: 'avatars' | 'services' | 'resources'
 * @returns {Promise<string>}   - URL HTTPS pública del archivo
 */
function uploadFile(fileBuffer, originalName, folder = 'uploads') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${ROOT_FOLDER}/${folder}`,
        public_id: crypto.randomUUID(),
        resource_type: 'image',
        overwrite: false,
        // Optimiza tamaño y formato automáticamente (WebP/AVIF según navegador)
        transformation: [{ fetch_format: 'auto', quality: 'auto' }],
      },
      (error, result) => {
        if (error) {
          logger.error({ err: error }, 'Error subiendo a Cloudinary');
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    stream.end(fileBuffer);
  });
}

/**
 * Borra un archivo de Cloudinary a partir de su URL pública.
 * Si la URL no es de Cloudinary o no se puede parsear, lo registra y sigue (no lanza).
 */
async function deleteFile(fileUrl) {
  if (!fileUrl) return;
  try {
    const publicId = extractPublicId(fileUrl);
    if (!publicId) {
      logger.warn({ fileUrl }, 'No se pudo extraer public_id de Cloudinary; omitiendo borrado');
      return;
    }
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  } catch (error) {
    logger.error({ err: error, fileUrl }, 'Error eliminando archivo de Cloudinary');
  }
}

/**
 * Convierte una URL de Cloudinary en su public_id (sin extensión).
 *   https://res.cloudinary.com/demo/image/upload/v1700000000/reservas-tfg/avatars/abc.jpg
 *   → 'reservas-tfg/avatars/abc'
 */
function extractPublicId(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('cloudinary.com')) return null;

    const parts = u.pathname.split('/').filter(Boolean);
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1) return null;

    let after = parts.slice(uploadIdx + 1);
    // Saltar la versión opcional (v123456789)
    if (after[0] && /^v\d+$/.test(after[0])) after = after.slice(1);

    const joined = after.join('/');
    return joined.replace(path.extname(joined), '');
  } catch {
    return null;
  }
}

module.exports = { uploadFile, deleteFile };
