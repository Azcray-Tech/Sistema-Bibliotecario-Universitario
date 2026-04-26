const bcrypt = require('bcryptjs');
const { Administrador, Usuario } = require('../models');

exports.getLogin  = (req, res) => res.render('admin/login', { error: null });

exports.postLogin = async (req, res) => {
  const { cedula, password } = req.body;
  try {
    const usuario = await Usuario.findOne({
      where: { cedula },
      include: [{ model: Administrador, as: 'admin', required: true }]
    });
    if (!usuario) return res.render('admin/login', { error: 'Credenciales inválidas' });
    const valid = await bcrypt.compare(password, usuario.admin.password);
    if (!valid)  return res.render('admin/login', { error: 'Credenciales inválidas' });
    req.session.admin = { id: usuario.id, nombre: usuario.nombre + ' ' + usuario.apellido, rol: usuario.admin.rol };
    return res.redirect('/admin/dashboard');
  } catch(e) {
    console.error(e);
    return res.render('admin/login', { error: 'Error del servidor' });
  }
};

exports.logout = (req, res) => req.session.destroy(() => res.redirect('/admin/login'));
