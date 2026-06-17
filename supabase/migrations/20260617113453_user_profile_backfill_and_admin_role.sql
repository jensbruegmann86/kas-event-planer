insert into public.users (id, vorname, name, mail, rolle)
select
	au.id,
	coalesce(au.raw_user_meta_data ->> 'vorname', ''),
	coalesce(au.raw_user_meta_data ->> 'name', ''),
	au.email,
	'Volunteer'::public.rolle_enum
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null
	and au.email is not null;

do $$
declare
	first_auth_user_id uuid;
begin
	if not exists (select 1 from public.users where rolle = 'Admin') then
		select au.id
		into first_auth_user_id
		from auth.users au
		order by au.created_at asc
		limit 1;

		if first_auth_user_id is not null then
			update public.users
			set rolle = 'Admin'
			where id = first_auth_user_id;
		end if;
	end if;
end
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	target_role public.rolle_enum;
begin
	if exists (select 1 from public.users) then
		target_role := 'Volunteer';
	else
		target_role := 'Admin';
	end if;

	insert into public.users (id, vorname, name, mail, rolle)
	values (
		new.id,
		coalesce(new.raw_user_meta_data ->> 'vorname', ''),
		coalesce(new.raw_user_meta_data ->> 'name', ''),
		new.email,
		target_role
	)
	on conflict (id) do update
	set mail = excluded.mail;

	return new;
end;
$$;
