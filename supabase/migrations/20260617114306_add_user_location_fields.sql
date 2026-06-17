alter table public.users
  add column if not exists plz text,
  add column if not exists ort text;
