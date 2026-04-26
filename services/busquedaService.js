const { Material, Libro, Tesis, Revista, Anuario, Ejemplar, Autor } = require('../models');
const { Op } = require('sequelize');

exports.buscar = async ({ q, titulo, autor, isbn, categoria, tipo, page = 1, limit = 20 }) => {
  const where = {};
  if (q) where[Op.or] = [
    { titulo:  { [Op.like]: '%' + q + '%' } },
    { resumen: { [Op.like]: '%' + q + '%' } }
  ];
  if (titulo)    where.titulo    = { [Op.like]: '%' + titulo + '%' };
  if (categoria) where.categoria = categoria;
  if (tipo)      where.tipo      = tipo;

  const include = [
    { model: Libro,   as: 'libro',   required: false,
      where: isbn ? { isbn: { [Op.like]: '%' + isbn + '%' } } : undefined,
      include: [{ model: Autor, as: 'autores', through: { attributes: [] }, required: false }] },
    { model: Tesis,   as: 'tesis',   required: false,
      include: [{ model: Autor, as: 'autores', through: { attributes: [] }, required: false }] },
    { model: Revista, as: 'revista', required: false },
    { model: Anuario, as: 'anuario', required: false },
    { model: Ejemplar, as: 'ejemplares', required: false,
      attributes: ['id','codigo_inventario','estado'] }
  ];

  const offset = (page - 1) * limit;
  const { count, rows } = await Material.findAndCountAll({
    where, include, limit, offset,
    order: [['titulo','ASC']],
    distinct: true
  });

  const materiales = rows.map(m => {
    const data = m.toJSON();
    const disponibles = (m.ejemplares || []).filter(e => e.estado === 'disponible').length;
    
    let autor = '';
    if (m.libro && m.libro.autores && m.libro.autores.length > 0) {
      autor = m.libro.autores.map(a => a.nombre).join(', ');
    } else if (m.tesis && m.tesis.autores && m.tesis.autores.length > 0) {
      autor = m.tesis.autores.map(a => a.nombre).join(', ');
    }
    
    return { ...data, stock: disponibles, autor };
  });

  return { materiales, total: count, pages: Math.ceil(count / limit), page: +page };
};

exports.recientes = async (limit = 12) => {
  const rows = await Material.findAll({
    include: [
      { model: Ejemplar, as: 'ejemplares', required: false, attributes: ['estado'] },
      { model: Libro, as: 'libro', required: false,
        include: [{ model: Autor, as: 'autores', through: { attributes: [] }, required: false }] },
      { model: Tesis, as: 'tesis', required: false,
        include: [{ model: Autor, as: 'autores', through: { attributes: [] }, required: false }] }
    ],
    order: [['createdAt','DESC']],
    limit
  });
  return rows.map(m => {
    const disponibles = (m.ejemplares || []).filter(e => e.estado === 'disponible').length;
    let autor = '';
    if (m.libro && m.libro.autores && m.libro.autores.length > 0) {
      autor = m.libro.autores.map(a => a.nombre).join(', ');
    } else if (m.tesis && m.tesis.autores && m.tesis.autores.length > 0) {
      autor = m.tesis.autores.map(a => a.nombre).join(', ');
    }
    return { ...m.toJSON(), stock: disponibles, autor };
  });
};