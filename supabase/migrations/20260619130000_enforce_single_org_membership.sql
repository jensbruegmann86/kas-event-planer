create unique index if not exists org_members_active_user_uidx
  on public.organisation_members(user_id)
  where user_id is not null and status = 'active';

create unique index if not exists org_members_pending_or_active_email_uidx
  on public.organisation_members(lower(email))
  where status in ('pending', 'active');