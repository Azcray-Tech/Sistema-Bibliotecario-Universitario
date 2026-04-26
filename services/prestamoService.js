const { Prestamo, Ejemplar, Material, Usuario, Administrador } = require('../models');
const { Op } = require('sequelize');
const DIAS_PRESTAMO = 14, DIAS_RENO = 7;

exports.registrar = async (usuario_id, ejemplar_id) => {
  const u = await Usuario.findByPk(usuario_id);
  if (!u) throw new Error('Usuario no encontrado');
  if (u.suspendido && u.suspendido_hasta > new Date())
    throw new Error('Usuario suspendido hasta ' + new Date(u.suspendido_hasta).toLocaleDateString('es-VE'));

  const ej = await Ejemplar.findByPk(ejemplar_id, { include: [{ model: Material }] });
  if (!ej) throw new Error('Ejemplar no encontrado');
  if (ej.estado !== 'disponible') throw new Error('Ejemplar no disponible — estado: ' + ej.estado);

  const dev = new Date();
  dev.setDate(dev.getDate() + DIAS_PRESTAMO);

  const p = await Prestamo.create({ usuario_id, ejemplar_id, fecha_devolucion: dev });
  await ej.update({ estado: 'prestado' });
  return p;
};

exports.renovar = async (id) => {
  const p = await Prestamo.findByPk(id);
  if (!p || p.estado !== 'activo') throw new Error('Préstamo no renovable');
  if (p.renovado) throw new Error('Solo se permite una renovación por préstamo');
  const nf = new Date(p.fecha_devolucion);
  nf.setDate(nf.getDate() + DIAS_RENO);
  return p.update({ renovado: true, fecha_devolucion: nf });
};

exports.devolver = async (id) => {
  const p = await Prestamo.findByPk(id, {
    include: [{ model: Ejemplar }, { model: Usuario }]
  });
  if (!p || p.estado !== 'activo') throw new Error('Préstamo no encontrado o ya devuelto');
  const hoy = new Date();
  const retraso = Math.max(0, Math.floor((hoy - new Date(p.fecha_devolucion)) / 86400000));
  await p.update({ estado: 'devuelto', fecha_devolucion_real: hoy, dias_retraso: retraso });
  await p.Ejemplar.update({ estado: 'disponible' });
  if (retraso > 0) {
    const hasta = new Date();
    hasta.setDate(hasta.getDate() + retraso * 2);
    await p.Usuario.update({ suspendido: true, suspendido_hasta: hasta });
  }
  return p;
};
