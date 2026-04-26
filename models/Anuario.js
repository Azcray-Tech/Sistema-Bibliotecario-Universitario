const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Anuario = sequelize.define('Anuario', {
  id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  material_id:  { type: DataTypes.INTEGER, allowNull: false, unique: true },
  anio_edicion: { type: DataTypes.INTEGER }
}, { tableName: 'anuario', timestamps: false });

module.exports = Anuario;
