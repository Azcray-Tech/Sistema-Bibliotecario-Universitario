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
      where: isbn ? { isbn: { [Op.like]: '%' + isbn + '%' } } : undefined },
    { model: Tesis,   as: 'tesis',   required: false },
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

  // Calcular disponibles por material
  const materiales = rows.map(m => {
    const disponibles = (m.ejemplares || []).filter(e => e.estado === 'disponible').length;
    return { ...m.toJSON(), stock: disponibles };
  });

  return { materiales, total: count, pages: Math.ceil(count / limit), page: +page };
};

exports.recientes = async (limit = 12) => {
  const rows = await Material.findAll({
    include: [{ model: Ejemplar, as: 'ejemplares', required: false, attributes: ['estado'] }],
    order: [['createdAt','DESC']],
    limit
  });
  return rows.map(m => ({
    ...m.toJSON(),
    stock: (m.ejemplares || []).filter(e => e.estado === 'disponible').length
  }));
};
