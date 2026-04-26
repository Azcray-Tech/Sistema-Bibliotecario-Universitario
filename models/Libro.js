const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Libro = sequelize.define('Libro', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  material_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  isbn:        { type: DataTypes.STRING(20), unique: true },
  editorial:   { type: DataTypes.STRING(150) }
}, { tableName: 'libro', timestamps: false });

module.exports = Libro;
