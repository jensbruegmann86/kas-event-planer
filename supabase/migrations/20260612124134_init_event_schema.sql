create extension if not exists pgcrypto;

do $$
begin
	if not exists (select 1 from pg_type where typname = 'rolle_enum') then
		create type public.rolle_enum as enum ('Admin', 'Mitarbeiter', 'Ansprechpartner', 'Volunteer');
	end if;

	if not exists (select 1 from pg_type where typname = 'kleidergroesse_enum') then
		create type public.kleidergroesse_enum as enum ('XS', 'S', 'M', 'L', 'XL', '2XL', '3XL');
	end if;
end
$$;

create table if not exists public.events (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	datum date not null
);

create table if not exists public.users (
	id uuid primary key references auth.users(id) on delete cascade,
	vorname text not null,
	name text not null,
	strasse text,
	hausnummer text,
	mobil text,
	mail text not null unique,
	kleidergroesse_tshirt public.kleidergroesse_enum,
	kleidergroesse_jacke public.kleidergroesse_enum,
	schuhgroesse integer check (schuhgroesse between 36 and 48),
	rolle public.rolle_enum not null
);

create table if not exists public.standorte (
	id uuid primary key default gen_random_uuid(),
	event_id uuid not null references public.events(id) on delete cascade,
	name text not null,
	typ text not null,
	latitude double precision not null check (latitude between -90 and 90),
	longitude double precision not null check (longitude between -180 and 180),
	pdf_anhang_url text,
	bedarf_volunteers integer not null default 0 check (bedarf_volunteers >= 0)
);

create table if not exists public.gruppen (
	id uuid primary key default gen_random_uuid(),
	event_id uuid not null references public.events(id) on delete cascade,
	gruppenname text not null,
	ansprechpartner_id uuid references public.users(id) on delete set null
);

create table if not exists public.gruppen_mitglieder (
	gruppe_id uuid not null references public.gruppen(id) on delete cascade,
	user_id uuid not null references public.users(id) on delete cascade,
	primary key (gruppe_id, user_id)
);

create table if not exists public.standort_zuweisungen (
	id uuid primary key default gen_random_uuid(),
	standort_id uuid not null references public.standorte(id) on delete cascade,
	gruppe_id uuid references public.gruppen(id) on delete cascade,
	user_id uuid references public.users(id) on delete cascade,
	zugewiesen_am timestamptz not null default now(),
	constraint standort_zuweisungen_genau_eins_chk
		check (
			(gruppe_id is not null and user_id is null)
			or
			(gruppe_id is null and user_id is not null)
		)
);

create unique index if not exists gruppen_event_id_gruppenname_uidx
	on public.gruppen(event_id, gruppenname);

create index if not exists standorte_event_id_idx
	on public.standorte(event_id);

create index if not exists gruppen_event_id_idx
	on public.gruppen(event_id);

create index if not exists gruppen_ansprechpartner_id_idx
	on public.gruppen(ansprechpartner_id);

create index if not exists gruppen_mitglieder_user_id_idx
	on public.gruppen_mitglieder(user_id);

create index if not exists standort_zuweisungen_standort_id_idx
	on public.standort_zuweisungen(standort_id);

create index if not exists standort_zuweisungen_gruppe_id_idx
	on public.standort_zuweisungen(gruppe_id);

create index if not exists standort_zuweisungen_user_id_idx
	on public.standort_zuweisungen(user_id);

create unique index if not exists standort_zuweisungen_standort_gruppe_uidx
	on public.standort_zuweisungen(standort_id, gruppe_id)
	where gruppe_id is not null;

create unique index if not exists standort_zuweisungen_standort_user_uidx
	on public.standort_zuweisungen(standort_id, user_id)
	where user_id is not null;
