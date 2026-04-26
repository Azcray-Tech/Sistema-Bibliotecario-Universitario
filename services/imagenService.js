const sharp  = require('sharp');
const path   = require('path');
const fs     = require('fs');
require('dotenv').config();

const DIR = process.env.COVERS_DIR || './public/images/covers';

// Convierte texto a nombre de archivo seguro
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9]+/g, '-')     // reemplaza espacios y símbolos por -
    .replace(/^-+|-+$/g, '')          // quita - al inicio y final
    .substring(0, 80);                // máximo 80 chars
}

exports.guardar = async (file, titulo, autor, portadaAnterior) => {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

  // Generar nombre basado en título y autor
  const tituloSlug = slugify(titulo || 'material');
  const autorSlug  = slugify((autor || 'autor').split(',')[0]); // solo primer autor
  const filename   = `${tituloSlug}_${autorSlug}.jpg`;
  const destPath   = path.join(DIR, filename);

  // Sobreescribir — si ya existe el archivo simplemente se reemplaza
  await sharp(file.buffer)
    .resize(300, 400, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70, mozjpeg: true })
    .toFile(destPath);

  // Eliminar portada anterior si tenía un nombre diferente
  if (portadaAnterior) {
    const nombreAnterior = path.basename(portadaAnterior);
    if (nombreAnterior !== filename) {
      const rutaAnterior = path.join(DIR, nombreAnterior);
      if (fs.existsSync(rutaAnterior)) fs.unlinkSync(rutaAnterior);
    }
  }

  return '/images/covers/' + filename;
};