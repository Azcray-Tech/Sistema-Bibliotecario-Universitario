exports.requireStaff = (req, res, next) => {
  if (req.session && req.session.admin) return next();
  return res.redirect('/admin/login');
};

exports.requireAdmin = (req, res, next) => {
  if (req.session && req.session.admin && req.session.admin.rol === 'admin') return next();
  return res.redirect('/admin/login');
};
