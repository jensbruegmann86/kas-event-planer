create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.users (id, vorname, name, mail, rolle)
	values (
		new.id,
		coalesce(new.raw_user_meta_data ->> 'vorname', ''),
		coalesce(new.raw_user_meta_data ->> 'name', ''),
		new.email,
		'Volunteer'
	)
	on conflict (id) do nothing;

	return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();
