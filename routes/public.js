const express  = require('express');
const router   = express.Router();
const busqueda = require('../services/busquedaService');
const { Material, Ejemplar, Libro, Tesis, Revista, Anuario, Autor, Articulo } = require('../models');

router.get('/', async (req, res) => {
  const recientes = await busqueda.recientes(12);
  res.render('public/buscador', { query: {}, pages: 0, page: 1, recientes });
});

router.get('/buscar', async (req, res) => {
  const r = await busqueda.buscar({ ...req.query, page: parseInt(req.query.page) || 1 });
  res.render('public/lista_resultados', { ...r, query: req.query });
});

router.get('/material/:id', async (req, res) => {
  const material = await Material.findByPk(req.params.id, {
    include: [
      { model: Libro,    as: 'libro',    required: false,
        include: [{ model: Autor, as: 'autores', through: { attributes: [] } }] },
      { model: Tesis,    as: 'tesis',    required: false,
        include: [{ model: Autor, as: 'autores', through: { attributes: [] } }] },
      { model: Revista,  as: 'revista',  required: false,
        include: [{ model: Articulo, as: 'articulos', required: false,
          include: [{ model: Autor, as: 'autores', through: { attributes: [] } }] }] },
      { model: Anuario,  as: 'anuario',  required: false },
      { model: Ejemplar, as: 'ejemplares', required: false }
    ]
  });
  if (!material) return res.redirect('/');
  const disponibles = (material.ejemplares||[]).filter(e=>e.estado==='disponible').length;
  res.render('public/ficha_material', { material: material.toJSON(), disponibles });
});

module.exports = router;
