const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Administrador = sequelize.define('Administrador', {
  id:         { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  username:   { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password:   { type: DataTypes.STRING(255), allowNull: false }
}, { tableName: 'administrador', timestamps: false });

module.exports = Administrador;
