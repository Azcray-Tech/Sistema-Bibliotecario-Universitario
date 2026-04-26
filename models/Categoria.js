const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Categoria = sequelize.define('Categoria', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre:      { type: DataTypes.STRING(80), allowNull: false, unique: true },
  descripcion: { type: DataTypes.STRING(255) }
}, { tableName: 'categoria', timestamps: true });

module.exports = Categoria;