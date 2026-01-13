-- Desactivar RLS en todas las tablas para permitir acceso libre desde la app
-- Esto es útil para desarrollo o si controlas el acceso lógica del lado del cliente/servidor estrictamente

alter table public.productos disable row level security;
alter table public.movimientos disable row level security;
alter table public.usuarios disable row level security;
alter table public.promociones disable row level security;
alter table public.pagos_comisiones disable row level security;
