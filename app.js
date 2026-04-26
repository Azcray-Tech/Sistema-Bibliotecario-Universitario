require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path    = require('path');
const { sequelize } = require('./models');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }
}));

app.use('/', require('./routes/public'));
app.use('/admin', require('./routes/admin'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Error interno del servidor');
});

const PORT = process.env.PORT || 3000;
sequelize.sync({ alter: false }).then(() => {
  app.listen(PORT, '0.0.0.0', () => console.log(`Sistema Bibliográfico en http://0.0.0.0:${PORT}`));
}).catch(err => { console.error('Error BD:', err); process.exit(1); });
