-- Agregando columna de contraseña a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
