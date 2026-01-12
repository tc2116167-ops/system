-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enums (matched to types.ts)
create type talla_enum as enum ('XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única');
create type ubicacion_enum as enum ('Lima', 'Provincia');
create type tipo_movimiento_enum as enum ('Entrada', 'Salida', 'Venta');
create type propietario_enum as enum ('Dueño 1', 'Dueño 2', 'Dueño 3');
create type user_role_enum as enum ('Administrador General', 'Dueño', 'Vendedor');
create type estado_usuario_enum as enum ('Activo', 'Inactivo');
create type comision_tipo_enum as enum ('monto', 'porcentaje');
create type estado_comision_enum as enum ('Pendiente', 'Pagado');
create type estado_promocion_enum as enum ('Activa', 'Inactiva');
create type tipo_promocion_enum as enum ('cantidad_fija', 'descuento_porcentaje');

-- Tables

-- Usuarios
create table public.usuarios (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  email text unique not null,
  -- password field is omitted as Supabase Auth determines this. 
  -- If you manage users manually, you can add it, but it's not recommended.
  role user_role_enum not null,
  propietario_asignado propietario_enum,
  fecha_registro timestamp with time zone default now(),
  estado estado_usuario_enum default 'Activo'
);

-- Productos
create table public.productos (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  talla talla_enum not null,
  color text not null,
  stock integer default 0,
  precio_base numeric not null,
  propietario propietario_enum not null,
  comision_valor numeric default 0,
  comision_tipo comision_tipo_enum default 'monto',
  created_at timestamp with time zone default now()
);

-- Promociones
create table public.promociones (
  id uuid default uuid_generate_v4() primary key,
  nombre text not null,
  descripcion text,
  tipo tipo_promocion_enum not null,
  cantidad_requerida integer not null,
  valor_promo numeric not null,
  modelos_aplicables text[], -- Array of strings
  propietario_id propietario_enum not null,
  estado estado_promocion_enum default 'Activa',
  created_at timestamp with time zone default now()
);

-- Movimientos
create table public.movimientos (
  id uuid default uuid_generate_v4() primary key,
  producto_id uuid references public.productos(id) on delete restrict,
  tipo tipo_movimiento_enum not null,
  cantidad integer not null,
  precio_venta numeric,
  comision_pagada numeric,
  estado_comision estado_comision_enum,
  vendedor text, -- Could be a foreign key to users if desired
  ubicacion ubicacion_enum,
  fecha timestamp with time zone default now(),
  comentario text,
  propietario_id propietario_enum
);

-- Pagos Comisiones
create table public.pagos_comisiones (
  id uuid default uuid_generate_v4() primary key,
  vendedor text not null,
  monto numeric not null,
  fecha timestamp with time zone default now(),
  periodo text
);