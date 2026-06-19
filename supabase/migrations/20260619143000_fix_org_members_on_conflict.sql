create unique index if not exists org_members_org_email_exact_uidx
  on public.organisation_members(org_id, email);