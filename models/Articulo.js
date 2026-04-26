const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Articulo = sequelize.define('Articulo', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  revista_id: { type: DataTypes.INTEGER, allowNull: false },
  titulo:     { type: DataTypes.STRING(255), allowNull: false },
  paginas:    { type: DataTypes.STRING(20) }
}, { tableName: 'articulo', timestamps: false });

module.exports = Articulo;
