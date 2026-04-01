const { minioClient, BUCKET_NAME } = require('../config/storage');
const path = require('path');
const crypto = require('crypto');

/**
 * Sube un archivo a MinIO/S3
 * @param {Buffer} fileBuffer - Contenido del archivo
 * @param {string} originalName - Nombre original del archivo
 * @param {string} folder - Carpeta destino (ej: 'avatars', 'services')
 * @returns {string} URL pública del archivo
 */
async function uploadFile(fileBuffer, originalName, folder = 'uploads') {
  const ext = path.extname(originalName);
  const uniqueName = `${folder}/${crypto.randomUUID()}${ext}`;

  await minioClient.putObject(BUCKET_NAME, uniqueName, fileBuffer, {
    'Content-Type': getContentType(ext),
  });

  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  const port = process.env.MINIO_PORT || '9000';
  return `http://${endpoint}:${port}/${BUCKET_NAME}/${uniqueName}`;
}

/**
 * Elimina un archivo de MinIO/S3
 */
async function deleteFile(fileUrl) {
  try {
    const url = new URL(fileUrl);
    const objectName = url.pathname.replace(`/${BUCKET_NAME}/`, '');
    await minioClient.removeObject(BUCKET_NAME, objectName);
  } catch (error) {
    console.error('⚠️  Error eliminando archivo:', error.message);
  }
}

function getContentType(ext) {
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
  };
  return types[ext.toLowerCase()] || 'application/octet-stream';
}

module.exports = { uploadFile, deleteFile };
