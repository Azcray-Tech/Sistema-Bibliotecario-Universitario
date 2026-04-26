const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Revista = sequelize.define('Revista', {
  id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  material_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  issn:        { type: DataTypes.STRING(20) }
}, { tableName: 'revista', timestamps: false });

module.exports = Revista;
