const { DataTypes } = require('sequelize');
const sequelize     = require('../config/database');
const Material      = require('./Material');
const Libro         = require('./Libro');
const Tesis         = require('./Tesis');
const Revista       = require('./Revista');
const Anuario       = require('./Anuario');
const Ejemplar      = require('./Ejemplar');
const Autor         = require('./Autor');
const Articulo      = require('./Articulo');
const Usuario       = require('./Usuario');
const Administrador = require('./Administrador');
const Prestamo      = require('./Prestamo');
const Categoria     = require('./Categoria');

// Modelos pivot (sin timestamps)
const LibroAutor = sequelize.define('libro_autor', {
  libro_id: { type: DataTypes.INTEGER, primaryKey: true },
  autor_id: { type: DataTypes.INTEGER, primaryKey: true }
}, { tableName: 'libro_autor', timestamps: false });

const TesisAutor = sequelize.define('tesis_autor', {
  tesis_id: { type: DataTypes.INTEGER, primaryKey: true },
  autor_id: { type: DataTypes.INTEGER, primaryKey: true }
}, { tableName: 'tesis_autor', timestamps: false });

const ArticuloAutor = sequelize.define('articulo_autor', {
  articulo_id: { type: DataTypes.INTEGER, primaryKey: true },
  autor_id:    { type: DataTypes.INTEGER, primaryKey: true }
}, { tableName: 'articulo_autor', timestamps: false });

// Material -> subtipos (1:1)
Material.hasOne(Libro,    { foreignKey: 'material_id', as: 'libro' });
Material.hasOne(Tesis,    { foreignKey: 'material_id', as: 'tesis' });
Material.hasOne(Revista,  { foreignKey: 'material_id', as: 'revista' });
Material.hasOne(Anuario,  { foreignKey: 'material_id', as: 'anuario' });
Libro.belongsTo(Material,   { foreignKey: 'material_id' });
Tesis.belongsTo(Material,   { foreignKey: 'material_id' });
Revista.belongsTo(Material, { foreignKey: 'material_id' });
Anuario.belongsTo(Material, { foreignKey: 'material_id' });

// Material -> Ejemplar (1:N)
Material.hasMany(Ejemplar, { foreignKey: 'material_id', as: 'ejemplares' });
Ejemplar.belongsTo(Material, { foreignKey: 'material_id' });

// Autor N:N Libro
Libro.belongsToMany(Autor, { through: LibroAutor, foreignKey: 'libro_id', as: 'autores' });
Autor.belongsToMany(Libro, { through: LibroAutor, foreignKey: 'autor_id', as: 'libros' });

// Autor N:N Tesis
Tesis.belongsToMany(Autor, { through: TesisAutor, foreignKey: 'tesis_id', as: 'autores' });
Autor.belongsToMany(Tesis, { through: TesisAutor, foreignKey: 'autor_id', as: 'tesis' });

// Revista -> Articulo (1:N)
Revista.hasMany(Articulo, { foreignKey: 'revista_id', as: 'articulos' });
Articulo.belongsTo(Revista, { foreignKey: 'revista_id' });

// Autor N:N Articulo
Articulo.belongsToMany(Autor, { through: ArticuloAutor, foreignKey: 'articulo_id', as: 'autores' });
Autor.belongsToMany(Articulo, { through: ArticuloAutor, foreignKey: 'autor_id',    as: 'articulos' });

// Usuario -> Administrador (1:1)
Usuario.hasOne(Administrador,   { foreignKey: 'usuario_id', as: 'admin' });
Administrador.belongsTo(Usuario,{ foreignKey: 'usuario_id' });

// Prestamo: Usuario <-> Ejemplar
Usuario.hasMany(Prestamo,   { foreignKey: 'usuario_id' });
Prestamo.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Ejemplar.hasMany(Prestamo,   { foreignKey: 'ejemplar_id' });
Prestamo.belongsTo(Ejemplar, { foreignKey: 'ejemplar_id' });

module.exports = {
  sequelize,
  Material, Libro, Tesis, Revista, Anuario,
  Ejemplar, Autor, Articulo,
  Usuario, Administrador, Prestamo,
  Categoria,
  LibroAutor, TesisAutor, ArticuloAutor
};