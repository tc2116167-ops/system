-- Función de base de datos para crear usuarios de Auth
-- Esta función DEBE ser ejecutada en el SQL Editor de Supabase
-- Permite que un usuario autenticado (si tiene el rol adecuado) cree otros usuarios.

create or replace function public.create_new_user(
  email text,
  password text,
  user_metadata jsonb,
  role_name text -- Este es el rol en tu tabla public.usuarios (enum), no el rol de BD
)
returns text
language plpgsql
security definer -- IMPORTANTE: Se ejecuta con permisos de superusuario
as $$
declare
  new_user_id uuid;
begin
  -- 1. Crear el usuario en auth.users
  new_user_id := uuid_generate_v4();
  
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(), -- Confirmado automáticamente
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    user_metadata,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  -- 2. Insertar en public.usuarios (tu tabla personalizada)
  -- El ID debe coincidir
  insert into public.usuarios (
    id,
    email,
    nombre,
    role,
    estado,
    propietario_asignado,
    fecha_registro
  ) values (
    new_user_id,
    email,
    user_metadata->>'nombre',
    role_name::user_role_enum, -- Castear al enum correcto
    'Activo',
    (user_metadata->>'propietario_asignado')::propietario_enum, -- Castear si existe, o null
    now()
  );

  return new_user_id::text;
end;
$$;
