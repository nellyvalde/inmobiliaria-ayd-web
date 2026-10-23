-- Parte 2: permite que la página pública sepa qué inmuebles están ocultos (sin revelar sus datos).
-- Pegar en Supabase -> SQL Editor -> New query -> Run.

create or replace function public.codigos_ocultos()
returns setof integer
language sql
stable
security definer
set search_path = public
as $$
  select codigo from public.inmuebles where publicado = false;
$$;

grant execute on function public.codigos_ocultos() to anon, authenticated;
