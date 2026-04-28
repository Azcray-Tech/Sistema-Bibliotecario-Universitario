# Sistema Bibliotecario

> Sistema de gestión bibliotecaria moderno con acceso desde red local (LAN)

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-00758F.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema integral para la administración de bibliotecas, permitiendo gestionar materiales, préstamos, usuarios y generar reportes. Diseñado para funcionar en una red local con acceso web.

## Características Principales

- **Gestión de Materiales**: Libros, revistas, tesis, anuarios y artículos
- **Catálogo Público**: Búsqueda avanzada con filtros por título, autor, ISBN, categoría y tipo
- **Sistema de Préstamos**: Registro, renovación y devolución de materiales
- **Gestión de Usuarios**: Administración de estudiantes, profesores y usuarios
- **Reportes**: Generación de informes en PDF y Excel
- **Backup**: Creación automática de respaldos de la base de datos
- **UI Moderna**: Interfaz responsiva con diseño elegante y sidebar colapsable

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de la base de datos

# Iniciar el servidor
npm start
```

El servidor estará disponible en `http://localhost:3000`

## Requisitos

| Requisito | Versión Mínima |
|-----------|----------------|
| Node.js | 18+ |
| MySQL / MariaDB | 8.0 / 10.6+ |
| mysqldump | Incluido en MySQL |

## Estructura del Proyecto

```
sistema-bibliotecario/
├── app.js                      # Punto de entrada de la aplicación
├── config/
│   └── database.js             # Configuración de Sequelize
├── models/                     # Modelos de la base de datos
├── controllers/                # Controladores de la aplicación
├── services/                   # Servicios de negocio
├── routes/                     # Rutas de la aplicación
│   ├── public.js               # Rutas públicas
│   └── admin.js                # Rutas administrativas
├── middleware/
│   └── auth.js                 # Middleware de autenticación
├── views/                      # Plantillas EJS
│   ├── public/                 # Vistas públicas
│   └── admin/                  # Vistas del panel admin
├── public/                     # Archivos estáticos
├── scripts/                    # Scripts utilitarios
└── backup/                     # Respaldos automáticos
```

## Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `admin` | Administrador | Acceso completo: usuarios, configuración, reportes, catálogo |
| `bibliotecario` | Bibliotecólogo | Préstamos, catálogo, categorías, inventarios, reportes |

## Reglas de Préstamo

| Regla | Detalle |
|-------|---------|
| Plazo estándar | 14 días |
| Renovaciones | 1 permitida (máximo +7 días) |
| Sanción por retraso | Suspensión por (días de retraso × 2) días |

## Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=biblioteca
DB_USER=root
DB_PASS=tu_contraseña
SESSION_SECRET=tu_secreto_aqui
BACKUP_DIR=./backup
COVERS_DIR=./public/images/covers
MYSQLDUMP_PATH=C:\xampp\mysql\bin\mysqldump.exe
```

## Scripts Disponibles

```bash
npm start        # Iniciar el servidor
npm run dev      # Iniciar con nodemon (desarrollo)
```

## Contribuir

1. Fork el repositorio
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

Desarrollado para bibliotecas universitarias