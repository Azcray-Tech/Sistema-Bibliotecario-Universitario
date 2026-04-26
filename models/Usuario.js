const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id:               { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre:           { type: DataTypes.STRING(120), allowNull: false },
  apellido:         { type: DataTypes.STRING(120), allowNull: false },
  cedula:           { type: DataTypes.STRING(20), allowNull: false, unique: true },
  telefono:         { type: DataTypes.STRING(20) },
  correo:           { type: DataTypes.STRING(150) },
  tipo:             { type: DataTypes.ENUM('estudiante','profesor','publico'), defaultValue: 'estudiante' },
  suspendido:       { type: DataTypes.BOOLEAN, defaultValue: false },
  suspendido_hasta: { type: DataTypes.DATE }
}, { tableName: 'usuario', timestamps: true });

module.exports = Usuario;
