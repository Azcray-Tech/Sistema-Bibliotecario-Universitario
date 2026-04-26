const archiver = require('archiver');
const path     = require('path');
const fs       = require('fs');
const { exec } = require('child_process');
require('dotenv').config();

// Ruta al ejecutable mysqldump de XAMPP en Windows
const MYSQLDUMP = process.env.MYSQLDUMP_PATH || 'C:\\xampp\\mysql\\bin\\mysqldump.exe';

exports.generarBackup = async () => {
  const BD  = process.env.BACKUP_DIR  || './backup';
  const COV = process.env.COVERS_DIR  || './public/images/covers';

  if (!fs.existsSync(BD)) fs.mkdirSync(BD, { recursive: true });

  const fecha   = new Date().toISOString().slice(0, 10);
  const hora    = new Date().toTimeString().slice(0, 8).replace(/:/g, '-');
  const nombre  = `backup_${fecha}_${hora}`;
  const sqlFile = path.join(BD, `${nombre}.sql`);
  const zipFile = path.join(BD, `${nombre}.zip`);

  // 1 — Volcar base de datos
  await new Promise((resolve, reject) => {
    const usuario  = process.env.DB_USER || 'root';
    const password = process.env.DB_PASS || '';
    const baseDatos = process.env.DB_NAME || 'biblioteca';
    const host     = process.env.DB_HOST  || 'localhost';
    const port     = process.env.DB_PORT  || '3306';

    // Construir comando con o sin contraseña
    const passArg = password ? `-p${password}` : '';
    const cmd = `"${MYSQLDUMP}" -h${host} -P${port} -u${usuario} ${passArg} --single-transaction --routines --triggers ${baseDatos} > "${sqlFile}"`;

    exec(cmd, { shell: true }, (err, stdout, stderr) => {
      if (err) {
        console.error('Error mysqldump:', stderr);
        return reject(new Error('Error al volcar la base de datos: ' + stderr));
      }
      resolve();
    });
  });

  // Verificar que el SQL se generó y no está vacío
  if (!fs.existsSync(sqlFile) || fs.statSync(sqlFile).size === 0) {
    throw new Error('El archivo SQL generado está vacío. Revisa las credenciales de la BD.');
  }

  // 2 — Crear ZIP con SQL + portadas
  await new Promise((resolve, reject) => {
    const output  = fs.createWriteStream(zipFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);

    // Agregar el SQL
    archive.file(sqlFile, { name: `base_de_datos/${path.basename(sqlFile)}` });

    // Agregar portadas si existen
    if (fs.existsSync(COV) && fs.readdirSync(COV).length > 0) {
      archive.directory(COV, 'portadas');
    }

    archive.finalize();
  });

  // 3 — Eliminar SQL temporal (ya está dentro del ZIP)
  fs.unlinkSync(sqlFile);

  // 4 — Registrar en log
  const logLine = `${new Date().toISOString()} | ${path.basename(zipFile)} | ${(fs.statSync(zipFile).size / 1024).toFixed(1)} KB\n`;
  fs.appendFileSync(path.join(BD, 'backup.log'), logLine);

  return zipFile;
};

// Listar backups existentes
exports.listarBackups = () => {
  const BD = process.env.BACKUP_DIR || './backup';
  if (!fs.existsSync(BD)) return [];

  return fs.readdirSync(BD)
    .filter(f => f.endsWith('.zip'))
    .map(f => {
      const stat = fs.statSync(path.join(BD, f));
      return {
        nombre: f,
        ruta:   path.join(BD, f),
        fecha:  stat.mtime,
        tamaño: (stat.size / 1024).toFixed(1) + ' KB'
      };
    })
    .sort((a, b) => b.fecha - a.fecha);
};