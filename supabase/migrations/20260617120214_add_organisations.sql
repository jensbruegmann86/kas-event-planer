-- ==========================================
-- Organisations & Membership
-- ==========================================

create table if not exists public.organisations (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  created_by uuid        not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.organisation_members (
  id         uuid        primary key default gen_random_uuid(),
  org_id     uuid        not null references public.organisations(id) on delete cascade,
  user_id    uuid        references public.users(id) on delete set null,
  email      text        not null,
  role       text        not null default 'member',
  status     text        not null default 'pending',
  invited_by uuid        references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  joined_at  timestamptz,
  constraint org_member_role_chk   check (role   in ('admin', 'member')),
  constraint org_member_status_chk check (status in ('pending', 'active'))
);

create unique index if not exists org_members_org_email_uidx
  on public.organisation_members(org_id, lower(email));
create index if not exists org_members_org_id_idx  on public.organisation_members(org_id);
create index if not exists org_members_user_id_idx on public.organisation_members(user_id);
create index if not exists org_members_email_idx   on public.organisation_members(lower(email));

-- Add org_id to events
alter table public.events
  add column if not exists org_id uuid references public.organisations(id) on delete cascade;
create index if not exists events_org_id_idx on public.events(org_id);

-- ==========================================
-- Function: activate pending org memberships on login
-- ==========================================
create or replace function public.activate_pending_org_memberships(
  p_user_id uuid,
  p_email   text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.organisation_members
  set user_id = p_user_id,
      status  = 'active',
      joined_at = now()
  where lower(email) = lower(p_email)
    and status = 'pending'
    and user_id is null;
end;
$$;

-- Trigger: auto-activate on new auth user signup
create or replace function public.handle_new_user_org_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.activate_pending_org_memberships(new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_org_link on auth.users;
create trigger on_auth_user_org_link
  after insert on auth.users
  for each row execute function public.handle_new_user_org_link();

-- ==========================================
-- RLS: organisations
-- ==========================================
alter table public.organisations enable row level security;

create policy "org_select_member"
  on public.organisations for select to authenticated
  using (
    exists (
      select 1 from public.organisation_members om
      where om.org_id = id
        and om.user_id = auth.uid()
        and om.status = 'active'
    )
  );

create policy "org_update_admin"
  on public.organisations for update to authenticated
  using (
    exists (
      select 1 from public.organisation_members om
      where om.org_id = id
        and om.user_id = auth.uid()
        and om.role   = 'admin'
        and om.status = 'active'
    )
  )
  with check (
    exists (
      select 1 from public.organisation_members om
      where om.org_id = id
        and om.user_id = auth.uid()
        and om.role   = 'admin'
        and om.status = 'active'
    )
  );

create policy "org_insert_authenticated"
  on public.organisations for insert to authenticated
  with check (created_by = auth.uid());

create policy "org_service_role_all"
  on public.organisations for all to service_role
  using (true) with check (true);

-- ==========================================
-- RLS: organisation_members
-- ==========================================
alter table public.organisation_members enable row level security;

create policy "org_members_select"
  on public.organisation_members for select to authenticated
  using (
    user_id = auth.uid()
    or
    exists (
      select 1 from public.organisation_members om2
      where om2.org_id  = org_id
        and om2.user_id = auth.uid()
        and om2.status  = 'active'
    )
  );

create policy "org_members_insert_admin"
  on public.organisation_members for insert to authenticated
  with check (
    exists (
      select 1 from public.organisation_members om
      where om.org_id  = org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.status  = 'active'
    )
  );

create policy "org_members_update_admin"
  on public.organisation_members for update to authenticated
  using (
    user_id != auth.uid()
    and
    exists (
      select 1 from public.organisation_members om
      where om.org_id  = org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.status  = 'active'
    )
  );

create policy "org_members_delete_admin"
  on public.organisation_members for delete to authenticated
  using (
    user_id != auth.uid()
    and
    exists (
      select 1 from public.organisation_members om
      where om.org_id  = org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.status  = 'active'
    )
  );

create policy "org_members_service_role_all"
  on public.organisation_members for all to service_role
  using (true) with check (true);

-- ==========================================
-- RLS: events (org-scoped)
-- ==========================================
alter table public.events enable row level security;

create policy "events_select_org_member"
  on public.events for select to authenticated
  using (
    org_id is null
    or
    exists (
      select 1 from public.organisation_members om
      where om.org_id  = events.org_id
        and om.user_id = auth.uid()
        and om.status  = 'active'
    )
  );

create policy "events_insert_org_admin"
  on public.events for insert to authenticated
  with check (
    exists (
      select 1 from public.organisation_members om
      where om.org_id  = org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.status  = 'active'
    )
  );

create policy "events_update_org_admin"
  on public.events for update to authenticated
  using (
    exists (
      select 1 from public.organisation_members om
      where om.org_id  = events.org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.status  = 'active'
    )
  );

create policy "events_delete_org_admin"
  on public.events for delete to authenticated
  using (
    exists (
      select 1 from public.organisation_members om
      where om.org_id  = events.org_id
        and om.user_id = auth.uid()
        and om.role    = 'admin'
        and om.status  = 'active'
    )
  );

create policy "events_service_role_all"
  on public.events for all to service_role
  using (true) with check (true);

-- ==========================================
-- Backfill: create org for existing Admin users
-- ==========================================
do $$
declare
  v_user   record;
  v_org_id uuid;
begin
  for v_user in
    select u.id, u.mail,
           coalesce(nullif(trim(u.vorname || ' ' || u.name), ''), 'Meine Organisation') as display_name
    from public.users u
    where u.rolle = 'Admin'
      and not exists (
        select 1 from public.organisation_members om where om.user_id = u.id
      )
  loop
    insert into public.organisations (name, created_by)
    values (v_user.display_name || 's Organisation', v_user.id)
    returning id into v_org_id;

    insert into public.organisation_members (org_id, user_id, email, role, status, invited_by, joined_at)
    values (v_org_id, v_user.id, v_user.mail, 'admin', 'active', v_user.id, now());
  end loop;
end;
$$;

-- Assign existing events to the admin's org
update public.events e
set org_id = om.org_id
from public.organisation_members om
where om.user_id  = (select id from public.users where rolle = 'Admin' limit 1)
  and om.role     = 'admin'
  and om.status   = 'active'
  and e.org_id is null;
