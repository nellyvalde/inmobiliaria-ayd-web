-- Inmobiliaria A&D: base de datos del panel de inmuebles.
-- Se pega UNA vez en Supabase -> SQL Editor -> New query -> Run.
-- Es seguro volver a correrlo: usa "if not exists" y "create or replace".

-- 1) Quiénes pueden administrar (editar) los inmuebles
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

-- Solo un administrador puede ver quiénes son los administradores
drop policy if exists "admins se ven entre si" on public.admins;
create policy "admins se ven entre si" on public.admins
  for select to authenticated
  using ((auth.jwt() ->> 'email') in (select email from public.admins));

-- Función auxiliar: ¿el usuario que consulta es administrador?
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() ->> 'email') in (select email from public.admins), false);
$$;

-- 2) Los inmuebles. El contenido completo va en "datos" (JSON); lo demás sirve para listar y filtrar.
create table if not exists public.inmuebles (
  codigo      integer primary key,
  publicado   boolean not null default true,
  estado      text not null default 'Disponible',
  titulo      text not null,
  categoria   text not null default 'lote',
  negocio     text not null default 'Venta',
  origen      text not null default 'panel',   -- 'panel' = creado en el panel; 'estatico' = ya está en la página
  datos       jsonb not null default '{}'::jsonb,
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
alter table public.inmuebles enable row level security;

create or replace function public.tocar_actualizado()
returns trigger language plpgsql as $$
begin
  new.actualizado = now();
  return new;
end;
$$;
drop trigger if exists tg_inmuebles_actualizado on public.inmuebles;
create trigger tg_inmuebles_actualizado before update on public.inmuebles
  for each row execute function public.tocar_actualizado();

-- Cualquier visitante puede VER los publicados. Solo un administrador escribe.
drop policy if exists "publico ve publicados" on public.inmuebles;
create policy "publico ve publicados" on public.inmuebles
  for select to anon, authenticated
  using (publicado = true or public.es_admin());

drop policy if exists "admin inserta" on public.inmuebles;
create policy "admin inserta" on public.inmuebles
  for insert to authenticated with check (public.es_admin());

drop policy if exists "admin actualiza" on public.inmuebles;
create policy "admin actualiza" on public.inmuebles
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "admin borra" on public.inmuebles;
create policy "admin borra" on public.inmuebles
  for delete to authenticated using (public.es_admin());

grant select on public.inmuebles to anon, authenticated;
grant insert, update, delete on public.inmuebles to authenticated;
grant select on public.admins to authenticated;

-- 3) Almacenamiento de fotos y videos (público para verlos; solo el admin sube o borra)
insert into storage.buckets (id, name, public, file_size_limit)
values ('inmuebles', 'inmuebles', true, 52428800)   -- 50 MB por archivo
on conflict (id) do update set public = true, file_size_limit = 52428800;

drop policy if exists "publico ve archivos" on storage.objects;
create policy "publico ve archivos" on storage.objects
  for select to anon, authenticated using (bucket_id = 'inmuebles');

drop policy if exists "admin sube archivos" on storage.objects;
create policy "admin sube archivos" on storage.objects
  for insert to authenticated with check (bucket_id = 'inmuebles' and public.es_admin());

drop policy if exists "admin cambia archivos" on storage.objects;
create policy "admin cambia archivos" on storage.objects
  for update to authenticated using (bucket_id = 'inmuebles' and public.es_admin());

drop policy if exists "admin borra archivos" on storage.objects;
create policy "admin borra archivos" on storage.objects
  for delete to authenticated using (bucket_id = 'inmuebles' and public.es_admin());

-- 4) Administradores iniciales (Nelly y Deisy).
insert into public.admins (email) values
  ('valderramanelly722@gmail.com'),
  ('inmobiliariaayd5@gmail.com')
on conflict do nothing;
