const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prestamo = sequelize.define('Prestamo', {
  id:                   { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  usuario_id:           { type: DataTypes.INTEGER, allowNull: false },
  ejemplar_id:          { type: DataTypes.INTEGER, allowNull: false },
  fecha_salida:         { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_devolucion:     { type: DataTypes.DATE, allowNull: false },
  fecha_devolucion_real:{ type: DataTypes.DATE },
  renovado:             { type: DataTypes.BOOLEAN, defaultValue: false },
  estado:               { type: DataTypes.ENUM('activo','devuelto','vencido'), defaultValue: 'activo' },
  dias_retraso:         { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'prestamo', timestamps: true });

module.exports = Prestamo;
