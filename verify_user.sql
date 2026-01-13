-- Script para verificar y corregir el usuario Rossell
-- Ejecuta esto PRIMERO para diagnosticar

-- 1. Verificar si existe en auth.users
SELECT 'Usuario en Auth:' as tipo, id, email, email_confirmed_at
FROM auth.users 
WHERE email = 'rossell.mestanza@gmail.com';

-- 2. Verificar si existe en public.usuarios
SELECT 'Usuario en Tabla:' as tipo, id, email, nombre, role, estado
FROM public.usuarios 
WHERE email = 'rossell.mestanza@gmail.com';

-- 3. Si no existe en public.usuarios, crear/actualizar
INSERT INTO public.usuarios (id, nombre, email, role, estado, propietario_asignado, fecha_registro)
SELECT 
    id, 
    'Rossell Mestanza', 
    email, 
    'Administrador General', 
    'Activo',
    NULL,
    COALESCE(created_at, NOW())
FROM auth.users 
WHERE email = 'rossell.mestanza@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET 
    email = EXCLUDED.email,
    role = 'Administrador General', 
    estado = 'Activo',
    nombre = 'Rossell Mestanza'
RETURNING id, email, nombre, role, estado;
