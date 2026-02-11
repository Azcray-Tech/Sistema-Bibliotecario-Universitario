# Sistema de Control Bibliográfico - Concepto Visual

## Descripción del Proyecto

Este conjunto de pantallas representa el concepto visual completo para el Sistema de Control Bibliográfico de la Biblioteca Especializada en Integración Latinoamericana.

## Pantallas Incluidas

### 1. **01-login.html** - Página de Login
- Diseño profesional con dos columnas
- Panel izquierdo con información institucional
- Formulario de acceso con validación de contraseñas seguras
- Link a consulta pública para usuarios no administrativos

### 2. **02-consulta-publica.html** - Módulo de Consulta Pública
- Búsqueda general y avanzada con tabs
- Filtros por título, autor, ISBN y categoría
- Resultados con miniaturas de portada
- Categorías rápidas para acceso directo
- Diseño optimizado para usuarios finales

### 3. **03-ficha-libro.html** - Detalle del Libro
- Vista completa de la información del libro
- Imagen de portada destacada
- Todos los campos requeridos: ISBN, ACTRA, ubicación, etc.
- Panel de disponibilidad
- Sección para resumen/ACTRA
- Enlace a material digital cuando aplique

### 4. **04-dashboard-admin.html** - Panel Administrativo Principal
- Sidebar de navegación con todas las secciones
- Tarjetas de estadísticas (libros, préstamos, usuarios)
- Actividad reciente
- Acciones rápidas
- Gráficos de estadísticas por categoría

### 5. **05-gestion-libros.html** - Formulario CRUD de Libros
- Formulario completo para agregar/editar libros
- Secciones organizadas (información básica, ubicación, portada, ACTRA, digital)
- Área de carga de imágenes con drag & drop visual
- Campo de texto editable para ACTRA (copiar/pegar desde Word/PDF)
- Validación de ISBN
- Soporte para materiales digitales (URL)

### 6. **06-gestion-prestamos.html** - Gestión de Préstamos
- Políticas de préstamo visibles
- Formulario de registro de préstamos
- Autocompletado de datos del usuario por cédula
- Lista de préstamos activos con estados
- Acciones de devolución y renovación
- Diferenciación estudiantes/profesores

### 7. **07-informes.html** - Informes e Inventario
- Reportes predefinidos (libros nuevos, estadísticas, retrasos, más solicitados)
- Tabla de inventario anual por categoría
- Sección de backup del sistema
- Generador de reportes personalizado
- Múltiples formatos de exportación (PDF, Excel, impresión)

## Características del Diseño

### Paleta de Colores
- **Primary**: #2c5f4f (Verde bosque profesional)
- **Secondary**: #8b7355 (Marrón cálido)
- **Accent**: #d4a574 (Dorado suave)
- **Background**: #f8f6f3 (Crema muy claro)
- **Text**: #2d2d2d (Gris oscuro legible)

### Tipografía
- **Títulos**: Libre Baskerville (serif elegante)
- **Cuerpo**: Source Sans 3 (sans-serif legible)
- **Tamaño base**: 14pt para facilitar lectura

### Principios de Diseño
1. **Sobriedad**: Colores no brillantes, apropiados para uso prolongado
2. **Legibilidad**: Tamaño de letra 14pt, contraste adecuado
3. **Profesionalismo**: Diseño limpio y organizado
4. **Usabilidad**: Iconografía clara, navegación intuitiva
5. **Funcionalidad**: Cada elemento cumple una función específica

## Navegación entre Pantallas

```
01-login.html
    ├── → 02-consulta-publica.html (usuarios públicos)
    └── → 04-dashboard-admin.html (administradores)

02-consulta-publica.html
    └── → 03-ficha-libro.html (al hacer clic en un libro)

04-dashboard-admin.html (Hub central)
    ├── → 05-gestion-libros.html (agregar/editar libros)
    ├── → 06-gestion-prestamos.html (gestión de préstamos)
    └── → 07-informes.html (reportes e inventario)
```

## Requerimientos Técnicos Cubiertos

- ✅ Información básica del libro (título, autor, ISBN, ACTRA)
- ✅ Código ISBN con validación de formato
- ✅ Imagen de portada (JPG/PNG, máx 200KB, 300x400px)
- ✅ Categorías predefinidas y gestionables
- ✅ Ubicación física (estante, biblioteca, código)
- ✅ Control de existencias
- ✅ Enlaces a material digital
- ✅ Búsquedas flexibles (general y específicas)
- ✅ Módulo administrativo seguro
- ✅ Gestión de préstamos con políticas
- ✅ Diferenciación estudiantes/profesores
- ✅ Sistema "inteligente" de autocompletado
- ✅ Generación de informes e inventario
- ✅ Sistema de backup

## Tecnologías Utilizadas

- **HTML5**: Estructura semántica
- **CSS3**: Estilos personalizados con variables CSS
- **Bootstrap 5.3.2**: Framework responsive
- **Bootstrap Icons 1.11.1**: Iconografía
- **Google Fonts**: Tipografía (Libre Baskerville & Source Sans 3)
- **JavaScript vanilla**: Interactividad básica (preview de imágenes)

## Cómo Usar

1. Descarga todos los archivos HTML
2. Abre cualquier archivo en tu navegador web
3. Navega entre las pantallas usando los enlaces
4. Comienza por **01-login.html** para ver el flujo completo

## Presentación para el Jueves

Estas pantallas están listas para presentar. Recomendaciones:

1. **Orden de presentación sugerido**:
   - Login (01)
   - Consulta Pública (02) → Ficha de Libro (03)
   - Dashboard Admin (04)
   - Gestión de Libros (05)
   - Gestión de Préstamos (06)
   - Informes e Inventario (07)

2. **Puntos clave a destacar**:
   - Diseño profesional y sobrio
   - Cumplimiento de todos los requerimientos
   - Interfaz intuitiva y fácil de usar
   - Responsive design
   - Funcionalidades completas

---

**Desarrollado con Bootstrap 5 | Listo para implementación**
