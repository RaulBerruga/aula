-- Aula · esquema. Pégalo en Supabase → SQL Editor → Run.
create table if not exists public.aula_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.aula_state enable row level security;

-- Cada usuario solo ve y modifica su propia fila
create policy "aula_select_own" on public.aula_state for select using (auth.uid() = user_id);
create policy "aula_insert_own" on public.aula_state for insert with check (auth.uid() = user_id);
create policy "aula_update_own" on public.aula_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "aula_delete_own" on public.aula_state for delete using (auth.uid() = user_id);

-- Sincronización en tiempo real entre dispositivos (opcional pero recomendado)
alter publication supabase_realtime add table public.aula_state;
