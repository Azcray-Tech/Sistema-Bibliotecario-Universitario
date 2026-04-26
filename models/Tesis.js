const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tesis = sequelize.define('Tesis', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  material_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  tutor:       { type: DataTypes.STRING(150) },
  grado:       { type: DataTypes.STRING(100) },
  institucion: { type: DataTypes.STRING(200) }
}, { tableName: 'tesis', timestamps: false });

module.exports = Tesis;
