const { Material, Libro, Tesis, Revista, Anuario, Ejemplar, Autor } = require('../models');
const imagenService = require('../services/imagenService');

const CATEGORIAS = ['Filosofia','Historia','Economia','Ciencias','Literatura','Tecnologia',
                    'Arte','Derecho','Medicina','Sociologia','Integracion Latinoamericana','Otro'];

const INCLUDE_COMPLETO = [
  { model: Libro,    as: 'libro',    required: false, include: [{ model: Autor, as: 'autores', through: { attributes: [] } }] },
  { model: Tesis,    as: 'tesis',    required: false, include: [{ model: Autor, as: 'autores', through: { attributes: [] } }] },
  { model: Revista,  as: 'revista',  required: false },
  { model: Anuario,  as: 'anuario',  required: false },
  { model: Ejemplar, as: 'ejemplares', required: false }
];

const INCLUDE_EDITAR = [
  { model: Libro,    as: 'libro',    required: false,
    include: [{ model: Autor, as: 'autores', through: { attributes: [] } }] },
  { model: Tesis,    as: 'tesis',    required: false,
    include: [{ model: Autor, as: 'autores', through: { attributes: [] } }] },
  { model: Revista,  as: 'revista',  required: false },
  { model: Anuario,  as: 'anuario',  required: false },
  { model: Ejemplar, as: 'ejemplares', required: false }
];

async function guardarAutores(subtipo, nombresStr, pivotSetMethod) {
  if (!nombresStr || !nombresStr.trim()) return;
  const nombres = nombresStr.split(',').map(n => n.trim()).filter(Boolean);
  const autoresIds = [];
  for (const nombre of nombres) {
    const [autor] = await Autor.findOrCreate({ where: { nombre } });
    autoresIds.push(autor.id);
  }
  await subtipo[pivotSetMethod](autoresIds);
}

exports.listar = async (req, res) => {
  try {
    const materiales = await Material.findAll({
      include: INCLUDE_COMPLETO,
      order: [['createdAt', 'DESC']]
    });
    const mats = materiales.map(m => ({
      ...m.toJSON(),
      stock: (m.ejemplares||[]).filter(e=>e.estado==='disponible').length,
      total_ejemplares: (m.ejemplares||[]).length
    }));
    res.render('admin/catalogo', { admin: req.session.admin, materiales: mats });
  } catch(e) {
    console.error(e);
    res.render('admin/catalogo', { admin: req.session.admin, materiales: [] });
  }
};

exports.nuevo = (req, res) =>
  res.render('admin/material_form', {
    admin: req.session.admin,
    material: null,
    categorias: CATEGORIAS,
    error: null
  });

exports.crear = async (req, res) => {
  try {
    const { titulo, anio, resumen, categoria, signatura, url_digital, tipo,
            isbn, editorial, tutor, grado, institucion, issn, anio_edicion,
            autores, cod_inventario } = req.body;

    let portada = null;
    // Se pasa titulo y autores para que el archivo se llame titulo_autor.jpg
    if (req.file) portada = await imagenService.guardar(req.file, titulo, autores);

    const mat = await Material.create({
      titulo, anio: anio||null, resumen, categoria,
      signatura, url_digital, tipo, portada
    });

    if (tipo === 'libro') {
      const libro = await Libro.create({ material_id: mat.id, isbn: isbn||null, editorial });
      await guardarAutores(libro, autores, 'setAutores');
    }
    if (tipo === 'tesis') {
      const tesis = await Tesis.create({ material_id: mat.id, tutor, grado, institucion });
      await guardarAutores(tesis, autores, 'setAutores');
    }
    if (tipo === 'revista') await Revista.create({ material_id: mat.id, issn: issn||null });
    if (tipo === 'anuario') await Anuario.create({ material_id: mat.id, anio_edicion: anio_edicion||null });

    const codigos = Array.isArray(cod_inventario)
      ? cod_inventario
      : (cod_inventario ? [cod_inventario] : []);
    for (const cod of codigos.filter(c => c && c.trim())) {
      await Ejemplar.create({ material_id: mat.id, codigo_inventario: cod.trim() });
    }

    res.redirect('/admin/catalogo');
  } catch(e) {
    console.error(e);
    res.render('admin/material_form', {
      admin: req.session.admin, material: null,
      categorias: CATEGORIAS, error: e.message
    });
  }
};

exports.editar = async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id, { include: INCLUDE_EDITAR });
    if (!material) return res.redirect('/admin/catalogo');

    const mat = material.toJSON();
    const autoresArr = (mat.libro && mat.libro.autores)
      ? mat.libro.autores
      : (mat.tesis && mat.tesis.autores ? mat.tesis.autores : []);
    mat.autores_str = autoresArr.map(a => a.nombre).join(', ');

    res.render('admin/material_form', {
      admin: req.session.admin,
      material: mat,
      categorias: CATEGORIAS,
      error: null
    });
  } catch(e) {
    console.error(e);
    res.redirect('/admin/catalogo');
  }
};

exports.actualizar = async (req, res) => {
  try {
    const material = await Material.findByPk(req.params.id, { include: INCLUDE_EDITAR });
    if (!material) return res.redirect('/admin/catalogo');

    const { titulo, anio, resumen, categoria, signatura, url_digital,
            isbn, editorial, tutor, grado, institucion, issn, anio_edicion,
            autores } = req.body;

    let portada = material.portada;
    // Se pasa titulo, autores y la portada actual para que borre la anterior si cambia
    if (req.file) portada = await imagenService.guardar(req.file, titulo, autores, material.portada);

    await material.update({ titulo, anio: anio||null, resumen, categoria, signatura, url_digital, portada });

    if (material.tipo === 'libro' && material.libro) {
      await material.libro.update({ isbn: isbn||null, editorial });
      await guardarAutores(material.libro, autores, 'setAutores');
    }
    if (material.tipo === 'tesis' && material.tesis) {
      await material.tesis.update({ tutor, grado, institucion });
      await guardarAutores(material.tesis, autores, 'setAutores');
    }
    if (material.tipo === 'revista' && material.revista)
      await material.revista.update({ issn: issn||null });
    if (material.tipo === 'anuario' && material.anuario)
      await material.anuario.update({ anio_edicion: anio_edicion||null });

    res.redirect('/admin/catalogo');
  } catch(e) {
    console.error(e);
    res.redirect('/admin/catalogo');
  }
};

exports.eliminar = async (req, res) => {
  try {
    const id = req.params.id;
    await Ejemplar.destroy({ where: { material_id: id } });
    await Material.destroy({ where: { id } });
  } catch(e) {
    console.error(e);
  }
  res.redirect('/admin/catalogo');
};