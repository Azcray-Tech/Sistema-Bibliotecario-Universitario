const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ejemplar = sequelize.define('Ejemplar', {
  id:                { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  material_id:       { type: DataTypes.INTEGER, allowNull: false },
  codigo_inventario: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  estado:            { type: DataTypes.ENUM('disponible','prestado','dañado','baja'), defaultValue: 'disponible' }
}, { tableName: 'ejemplar', timestamps: true });

module.exports = Ejemplar;
