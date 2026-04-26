const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const fs       = require('fs');
const path     = require('path');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const { requireAdmin } = require('../middleware/auth');
const Auth     = require('../controllers/AuthController');
const Catalogo = require('../controllers/CatalogoController');
const { Prestamo, Ejemplar, Material, Usuario, Administrador, Categoria } = require('../models');
const { Op }   = require('sequelize');
const prestamoSvc = require('../services/prestamoService');
const reporteSvc = require('../services/reporteService');
const backupSvc   = require('../services/backupService');

const CATEGORIAS = ['Filosofia','Historia','Economia','Ciencias','Literatura','Tecnologia',
                    'Arte','Derecho','Medicina','Sociologia','Integracion Latinoamericana','Otro'];

// ── Auth ──
router.get('/login',  Auth.getLogin);
router.post('/login', Auth.postLogin);
router.get('/logout', Auth.logout);

// ── Dashboard ──
router.get('/dashboard', requireAdmin, async (req, res) => {
  const { fn, col, literal } = require('sequelize');

  const totalMateriales  = await Material.count();
  const totalEjemplares  = await Ejemplar.count();
  const prestamosActivos = await Prestamo.count({ where: { estado: 'activo' } });
  const vencidos         = await Prestamo.count({ where: { estado: 'vencido' } });
  const totalUsuarios    = await Usuario.count();
  const disponibles      = await Ejemplar.count({ where: { estado: 'disponible' } });

  // Últimos 5 préstamos registrados
  const ultimosPrestamos = await Prestamo.findAll({
    include: [{ model: Ejemplar, include: [Material] }, { model: Usuario }],
    order: [['createdAt','DESC']], limit: 5
  });

  // Top 5 materiales más solicitados
  const masSolicitados = await Prestamo.findAll({
    attributes: [[fn('COUNT', col('Prestamo.id')), 'total'], 'ejemplar_id'],
    include: [{ model: Ejemplar, attributes: ['material_id'],
      include: [{ model: Material, attributes: ['id','titulo','tipo'] }] }],
    group: ['Ejemplar.material_id'],
    order: [[literal('total'), 'DESC']],
    limit: 5
  });

  // Materiales por tipo
  const porTipo = await Material.findAll({
    attributes: ['tipo', [fn('COUNT', col('id')), 'total']],
    group: ['tipo'], raw: true
  });

  res.render('admin/dashboard', {
    admin: req.session.admin,
    totalMateriales, totalEjemplares, prestamosActivos,
    vencidos, totalUsuarios, disponibles,
    ultimosPrestamos, masSolicitados, porTipo
  });
});

// ── Catálogo ──
router.get('/catalogo',               requireAdmin, Catalogo.listar);
router.get('/catalogo/nuevo',         requireAdmin, Catalogo.nuevo);
router.post('/catalogo',              requireAdmin, upload.single('portada'), Catalogo.crear);
router.get('/catalogo/:id/editar',    requireAdmin, Catalogo.editar);
router.post('/catalogo/:id',          requireAdmin, upload.single('portada'), Catalogo.actualizar);
router.post('/catalogo/:id/eliminar', requireAdmin, Catalogo.eliminar);

// ── Ejemplares ──
router.post('/catalogo/:id/ejemplar', requireAdmin, async (req, res) => {
  try {
    await Ejemplar.create({ material_id: req.params.id, codigo_inventario: req.body.codigo_inventario });
  } catch(e) { console.error(e); }
  res.redirect('/admin/catalogo/' + req.params.id + '/editar');
});
router.post('/ejemplar/:id/estado', requireAdmin, async (req, res) => {
  const ej = await Ejemplar.findByPk(req.params.id);
  if (ej) await ej.update({ estado: req.body.estado });
  res.redirect('back');
});

// ── Categorías (CRUD desde BD) ──

router.get('/categorias', requireAdmin, async (req, res) => {
  const categorias = await Categoria.findAll({ order: [['nombre','ASC']] });
  // Contar materiales por categoría
  const { Material } = require('../models');
  const counts = await Material.findAll({
    attributes: ['categoria', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total']],
    group: ['categoria'],
    raw: true
  });
  const countMap = {};
  counts.forEach(c => { countMap[c.categoria] = c.total; });
  const cats = categorias.map(c => ({ ...c.toJSON(), total_materiales: countMap[c.nombre] || 0 }));
  res.render('admin/categorias', { admin: req.session.admin, categorias: cats, error: null, success: null });
});

router.post('/categorias', requireAdmin, async (req, res) => {
  try {
    await Categoria.create({ nombre: req.body.nombre.trim(), descripcion: req.body.descripcion?.trim() || null });
    res.redirect('/admin/categorias');
  } catch(e) {
    const categorias = await Categoria.findAll({ order: [['nombre','ASC']] });
    res.render('admin/categorias', { admin: req.session.admin, categorias: categorias.map(c=>c.toJSON()), error: 'Ya existe una categoría con ese nombre.', success: null });
  }
});

router.post('/categorias/:id', requireAdmin, async (req, res) => {
  try {
    const cat = await Categoria.findByPk(req.params.id);
    if (cat) await cat.update({ nombre: req.body.nombre.trim(), descripcion: req.body.descripcion?.trim() || null });
    res.redirect('/admin/categorias');
  } catch(e) {
    res.redirect('/admin/categorias');
  }
});

router.post('/categorias/:id/eliminar', requireAdmin, async (req, res) => {
  try {
    await Categoria.destroy({ where: { id: req.params.id } });
  } catch(e) { console.error(e); }
  res.redirect('/admin/categorias');
});

// ── Préstamos ──
router.get('/prestamos', requireAdmin, async (req, res) => {
  const prestamos = await Prestamo.findAll({
    where: { estado: 'activo' },
    include: [
      { model: Ejemplar, include: [Material] },
      { model: Usuario }
    ],
    order: [['createdAt','DESC']], limit: 100
  });
  res.render('admin/prestamos', { admin: req.session.admin, prestamos, error: null });
});
router.post('/prestamos', requireAdmin, async (req, res) => {
  try {
    await prestamoSvc.registrar(req.body.usuario_id, req.body.ejemplar_id);
    res.redirect('/admin/prestamos');
  } catch(e) {
    const prestamos = await Prestamo.findAll({
      where: { estado: 'activo' },
      include: [{ model: Ejemplar, include: [Material] }, { model: Usuario }],
      order: [['createdAt','DESC']], limit: 100
    });
    res.render('admin/prestamos', { admin: req.session.admin, prestamos, error: e.message });
  }
});
router.post('/prestamos/:id/renovar',  requireAdmin, async (req, res) => { await prestamoSvc.renovar(req.params.id);  res.redirect('/admin/prestamos'); });
router.post('/prestamos/:id/devolver', requireAdmin, async (req, res) => { await prestamoSvc.devolver(req.params.id); res.redirect('/admin/prestamos'); });

// ── Historial ──
router.get('/prestamos/historial', requireAdmin, async (req, res) => {
  const prestamos = await Prestamo.findAll({
    include: [{ model: Ejemplar, include: [Material] }, { model: Usuario }],
    order: [['createdAt','DESC']]
  });
  res.render('admin/historial', { admin: req.session.admin, prestamos });
});

// ── Sanciones ──
router.get('/prestamos/sanciones', requireAdmin, async (req, res) => {
  const prestamosVencidos = await Prestamo.findAll({
    where: { [Op.or]: [{ estado: 'vencido' }, { dias_retraso: { [Op.gt]: 0 } }] },
    include: [{ model: Ejemplar, include: [Material] }, { model: Usuario }],
    order: [['dias_retraso','DESC']]
  });
  res.render('admin/sanciones', { admin: req.session.admin, prestamosVencidos });
});

// ── Informes (página) ──
router.get('/informes', requireAdmin, (req, res) =>
  res.render('admin/informes', { admin: req.session.admin }));

// ── Reportes ──────────────────────────────────────────────────────────────────
// Inventario completo
router.get('/reportes/inventario/completo/pdf',   requireAdmin, (req, res) => reporteSvc.inventarioCompletoPDF(res));
router.get('/reportes/inventario/completo/excel', requireAdmin, (req, res) => reporteSvc.inventarioCompletoExcel(res));

// Inventario por categoría
router.get('/reportes/inventario/categoria/:valor/pdf',   requireAdmin, (req, res) => reporteSvc.inventarioCategoriaPDF(res, req.params.valor));
router.get('/reportes/inventario/categoria/:valor/excel', requireAdmin, (req, res) => reporteSvc.inventarioCategoriaExcel(res, req.params.valor));

// Inventario por tipo
router.get('/reportes/inventario/tipo/:valor/pdf',   requireAdmin, (req, res) => reporteSvc.inventarioTipoPDF(res, req.params.valor));
router.get('/reportes/inventario/tipo/:valor/excel', requireAdmin, (req, res) => reporteSvc.inventarioTipoExcel(res, req.params.valor));

// Préstamos activos
router.get('/reportes/prestamos/activos/pdf',   requireAdmin, (req, res) => reporteSvc.prestamosActivosPDF(res));
router.get('/reportes/prestamos/activos/excel', requireAdmin, (req, res) => reporteSvc.prestamosActivosExcel(res));

// Más solicitados
router.get('/reportes/mas-solicitados/pdf',   requireAdmin, (req, res) => reporteSvc.masSolicitadosPDF(res));
router.get('/reportes/mas-solicitados/excel', requireAdmin, (req, res) => reporteSvc.masSolicitadosExcel(res));

// ── Inventario ──
router.get('/inventario', requireAdmin, async (req, res) => {
  const materiales   = await Material.findAll({ include: [{ model: Ejemplar, as: 'ejemplares', required: false }] });
  const map = {};
  materiales.forEach(m => {
    if (!map[m.categoria]) map[m.categoria] = { categoria: m.categoria, titulos: 0, total: 0, disponibles: 0, prestados: 0 };
    map[m.categoria].titulos++;
    const ejs = m.ejemplares || [];
    map[m.categoria].total      += ejs.length;
    map[m.categoria].disponibles+= ejs.filter(e=>e.estado==='disponible').length;
    map[m.categoria].prestados  += ejs.filter(e=>e.estado==='prestado').length;
  });
  const inventario = Object.values(map).sort((a,b)=>a.categoria.localeCompare(b.categoria));
  res.render('admin/inventario', { admin: req.session.admin, inventario });
});

// ── Usuarios ──
router.get('/usuarios', requireAdmin, async (req, res) => {
  const usuarios = await Usuario.findAll({ order: [['apellido','ASC'],['nombre','ASC']] });
  res.render('admin/usuarios', { admin: req.session.admin, usuarios });
});

// ── Backup ──
router.get('/backup', requireAdmin, (req, res) => {
  const logPath = path.join(__dirname, '../backup/backup.log');
  const logs    = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : null;
  const backups = backupSvc.listarBackups();
  res.render('admin/backup', { admin: req.session.admin, logs, backups, error: null, success: null });
});

router.post('/backup', requireAdmin, async (req, res) => {
  try {
    const zip = await backupSvc.generarBackup();
    // Redirigir a la página con mensaje de éxito y ofrecer descarga
    const logPath = path.join(__dirname, '../backup/backup.log');
    const logs    = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : null;
    const backups = backupSvc.listarBackups();
    res.render('admin/backup', {
      admin: req.session.admin, logs, backups, error: null,
      success: `Backup generado correctamente: ${path.basename(zip)}`
    });
  } catch(e) {
    console.error(e);
    const logPath = path.join(__dirname, '../backup/backup.log');
    const logs    = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : null;
    const backups = backupSvc.listarBackups();
    res.render('admin/backup', {
      admin: req.session.admin, logs, backups, success: null,
      error: 'Error al generar backup: ' + e.message
    });
  }
});

router.get('/backup/descargar/:nombre', requireAdmin, (req, res) => {
  const BD   = process.env.BACKUP_DIR || './backup';
  const file = path.join(__dirname, '..', BD, req.params.nombre);
  if (fs.existsSync(file)) {
    res.download(file);
  } else {
    res.redirect('/admin/backup');
  }
});

router.post('/backup/eliminar/:nombre', requireAdmin, (req, res) => {
  const BD   = process.env.BACKUP_DIR || './backup';
  const file = path.join(__dirname, '..', BD, req.params.nombre);
  try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch(e) { console.error(e); }
  res.redirect('/admin/backup');
});

// ── Configuración ──
router.get('/configuracion', requireAdmin, (req, res) =>
  res.render('admin/configuracion', { admin: req.session.admin }));

// ── API para módulo de préstamos ──────────────────────────────
// Agregar estas rutas en routes/admin.js ANTES de module.exports
// También agregar al inicio: const { Autor } = require('../models');

// Buscar usuario por cédula
router.get('/api/usuario', requireAdmin, async (req, res) => {
  const { cedula } = req.query;
  try {
    const u = await Usuario.findOne({
      where: { cedula },
      include: [{
        model: Prestamo,
        where: { estado: 'activo' },
        required: false,
        include: [{ model: Ejemplar, include: [Material] }]
      }]
    });

    if (!u) return res.json({ encontrado: false });

    const prestamosActivos = u.Prestamos || [];
    res.json({
      encontrado: true,
      usuario: {
        id:               u.id,
        nombre:           u.nombre,
        apellido:         u.apellido,
        cedula:           u.cedula,
        tipo:             u.tipo,
        telefono:         u.telefono,
        correo:           u.correo,
        suspendido:       u.suspendido,
        suspendido_hasta: u.suspendido_hasta,
        prestamos_activos: prestamosActivos.length,
        prestamos: prestamosActivos.map(p => ({
          material:   p.Ejemplar?.Material?.titulo || '-',
          ejemplar:   p.Ejemplar?.codigo_inventario || '-',
          devolucion: new Date(p.fecha_devolucion).toLocaleDateString('es-VE')
        }))
      }
    });
  } catch(e) {
    console.error(e);
    res.status(500).json({ encontrado: false, error: e.message });
  }
});

// Registrar usuario nuevo en el momento del préstamo
router.post('/api/usuario', requireAdmin, async (req, res) => {
  try {
    const { cedula, nombre, apellido, tipo, telefono, correo } = req.body;
    const u = await Usuario.create({ cedula, nombre, apellido, tipo, telefono: telefono||null, correo: correo||null });
    res.json({ ok: true, usuario: { id: u.id, nombre: u.nombre, apellido: u.apellido, cedula: u.cedula, tipo: u.tipo } });
  } catch(e) {
    res.json({ ok: false, error: e.message });
  }
});

// Buscar ejemplares disponibles por título
router.get('/api/ejemplares', requireAdmin, async (req, res) => {
  const { titulo } = req.query;
  const { Op } = require('sequelize');
  const { Autor, Libro } = require('../models');
  try {
    const materiales = await Material.findAll({
      where: { titulo: { [Op.like]: `%${titulo}%` } },
      include: [
        { model: Ejemplar, as: 'ejemplares',
          where: { estado: 'disponible' }, required: true },
        { model: Libro, as: 'libro', required: false,
          include: [{ model: Autor, as: 'autores', through: { attributes: [] } }] }
      ]
    });

    const resultado = [];
    materiales.forEach(m => {
      const autores = m.libro?.autores?.map(a => a.nombre).join(', ') || '';
      m.ejemplares.forEach(ej => {
        resultado.push({
          id:               ej.id,
          titulo:           m.titulo,
          autores,
          tipo:             m.tipo,
          codigo_inventario: ej.codigo_inventario
        });
      });
    });

    res.json(resultado);
  } catch(e) {
    console.error(e);
    res.status(500).json([]);
  }
});

module.exports = router;
