const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  titulo:      { type: DataTypes.STRING(255), allowNull: false },
  anio:        { type: DataTypes.INTEGER },
  resumen:     { type: DataTypes.TEXT },
  portada:     { type: DataTypes.STRING(255) },
  categoria:   { type: DataTypes.STRING(80), allowNull: false },
  url_digital: { type: DataTypes.STRING(500) },
  signatura:   { type: DataTypes.STRING(100) },
  tipo:        { type: DataTypes.ENUM('libro','tesis','revista','anuario'), allowNull: false }
}, { tableName: 'material', timestamps: true });

module.exports = Material;
