-- Agregar columna 'rol' a la tabla administrador
-- Ejecutar este script en MySQL/MariaDB

ALTER TABLE administrador
ADD COLUMN rol ENUM('admin', 'bibliotecario') DEFAULT 'bibliotecario';

-- Actualizar registros existentes con rol = 'admin'
UPDATE administrador SET rol = 'admin';

-- Verificar los cambios
SELECT id, username, rol FROM administrador;