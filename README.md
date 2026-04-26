# Sistema Bibliotecario — PWA Local LAN

Sistema de gestión bibliotecaria con acceso desde red local (LAN). Administra materiales, préstamos, usuarios y genera reportes.

## Requisitos

- **Node.js** 18+
- **MariaDB** 10.6+ o **MySQL** 8.0+
- **mysqldump** (incluido en instalación de MySQL/MariaDB)

## Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales de la base de datos

# Iniciar el servidor
npm start
```

El servidor estará disponible en `http://localhost:3000` (o el puerto configurado en .env).

## Estructura del Proyecto

```
├── app.js                  # Punto de entrada de la aplicación
├── config/                 # Configuración de base de datos
├── models/                 # Modelos Sequelize (Usuario, Material, Prestamo, etc.)
├── controllers/            # Controladores de la aplicación
├── services/               # Servicios (búsqueda, préstamos, imágenes, reportes, backup)
├── routes/                 # Rutas públicas y de administración
│   ├── public.js           # Rutas sin autenticación
│   └── admin.js            # Rutas con autenticación
├── middleware/             # Middleware (autenticación)
├── views/                  # Plantillas EJS
│   ├── public/             # Vistas públicas (buscador, resultados, ficha)
│   └── admin/              # Vistas del panel de administración
├── public/                 # Archivos estáticos (CSS, JS, imágenes)
├── backup/                 # Backups automáticos generados
└── documentos/             # Documentación del proyecto
```

## Características

- **Gestión de materiales**: Libros, revistas, tesis, anuarios, artículos
- **Catálogo público**: Búsqueda y consulta de materiales
- **Préstamos**: Registro, renovación y devolución
- **Usuarios**: Gestión de usuarios y administradores
- **Reportes**: Generación de informes en PDF y Excel
- **Backup**: Creación de backups automáticos de la base de datos
- **Imágenes**: Procesamiento de portadas de libros
- **Roles**: Administrador y Bibliotecario con permisos diferenciados

## Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `admin` | Administrador del sistema | Acceso completo: gestión de usuarios, configuración, reportes, catálogo |
| `bibliotecario` | Bibliotecólogo | Gestión de préstamos, catálogo, categorías, inventarios, reportes |

## Migración de Roles (solo si actualizas desde versión anterior)

Si actualizas desde una versión anterior, ejecuta el script de migración:

```bash
mysql -u root -p biblioteca < scripts/actualizar_rol.sql
```

## Crear Primer Administrador

Desde la base de datos (usando un hash de bcrypt):

```sql
INSERT INTO usuarios (cedula, nombre, tipo, password)
VALUES ('12345678', 'Administrador', 'admin', '$2b$10$...hash_bcrypt...');
```

O ejecutar el script:

```bash
node scripts/crear_admin.js
```

## Reglas de Préstamo

- **Plazo estándar**: 14 días
- **Renovación**: 1 vez, +7 días adicionales
- **Sanción por retraso**: Suspensión por (días de retraso × 2) días

## Variables de Entorno (.env)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| PORT | Puerto del servidor | 3000 |
| DB_HOST | Host de la base de datos | localhost |
| DB_PORT | Puerto de MySQL/MariaDB | 3306 |
| DB_NAME | Nombre de la base de datos | biblioteca |
| DB_USER | Usuario de la base de datos | root |
| DB_PASS | Contraseña de la base de datos | — |
| SESSION_SECRET | Clave para sesiones | cadena_secreta |

## Licencia

MIT