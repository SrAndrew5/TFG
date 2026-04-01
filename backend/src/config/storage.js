const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');

/**
 * Asegurar que la carpeta de uploads existe
 */
function ensureUploadDir() {
  const dirs = ['avatars', 'services', 'resources'];
  for (const dir of dirs) {
    const fullPath = path.join(UPLOAD_DIR, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Carpeta "${fullPath}" creada`);
    }
  }
}

/**
 * Sube un archivo al sistema de archivos local
 * @param {Buffer} fileBuffer - Contenido del archivo
 * @param {string} originalName - Nombre original del archivo
 * @param {string} folder - Carpeta destino (ej: 'avatars', 'services')
 * @returns {string} URL relativa del archivo
 */
function uploadFile(fileBuffer, originalName, folder = 'uploads') {
  const ext = path.extname(originalName);
  const uniqueName = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, folder, uniqueName);

  fs.writeFileSync(filePath, fileBuffer);
  return `/uploads/${folder}/${uniqueName}`;
}

/**
 * Elimina un archivo del sistema local
 */
function deleteFile(fileUrl) {
  try {
    const filePath = path.join(UPLOAD_DIR, '..', fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('⚠️  Error eliminando archivo:', error.message);
  }
}

module.exports = { uploadFile, deleteFile, ensureUploadDir, UPLOAD_DIR };
