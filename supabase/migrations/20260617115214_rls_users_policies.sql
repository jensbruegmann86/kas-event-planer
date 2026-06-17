-- Row Level Security fuer public.users aktivieren
alter table public.users enable row level security;

-- SELECT: Jeder eingeloggte User darf seine eigene Zeile lesen
create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

-- UPDATE: Jeder eingeloggte User darf seine eigene Zeile bearbeiten (ausser Rolle)
-- Die Rolle bleibt unveraendert, da sie nicht im UPDATE-Payload gesendet wird
create policy "users_update_own"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- INSERT: Erlaubt der Trigger-Funktion (security definer) neue Rows anzulegen.
-- Zusaetzlich darf der User selbst seine eigene Zeile anlegen (Fallback).
create policy "users_insert_own"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

-- SELECT fuer service_role (Supabase intern, Trigger etc.)
create policy "users_service_role_all"
  on public.users
  for all
  to service_role
  using (true)
  with check (true);
