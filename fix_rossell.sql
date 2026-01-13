-- Script para reparar/crear el usuario Rossell
-- Ejecuta esto en el SQL Editor de Supabase

DO $$
BEGIN
    -- Asegurar que existe en la tabla pública si ya existe en Auth
    INSERT INTO public.usuarios (id, nombre, email, role, estado)
    SELECT 
        id, 
        'Rossell Mestanza', 
        email, 
        'Administrador General', 
        'Activo'
    FROM auth.users 
    WHERE email = 'rossell.mestanza@gmail.com'
    ON CONFLICT (id) DO UPDATE 
    SET 
        role = 'Administrador General', 
        estado = 'Activo',
        nombre = 'Rossell Mestanza';
END $$;
