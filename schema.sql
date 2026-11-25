create table public.spots (
  id bigint generated always as identity primary key,
  name text not null check (char_length(trim(name)) between 1 and 60),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  created_at timestamptz not null default now()
);

create table public.observations (
  id bigint generated always as identity primary key,
  object_seen text not null check (char_length(trim(object_seen)) between 1 and 80),
  spot_name text not null check (char_length(trim(spot_name)) between 1 and 60),
  observed_on date not null default current_date check (observed_on <= current_date + 1),
  rating int not null check (rating between 1 and 5),
  notes text check (notes is null or char_length(notes) <= 300),
  created_at timestamptz not null default now()
);

alter table public.spots enable row level security;
alter table public.observations enable row level security;

revoke all on public.spots from anon, authenticated;
revoke all on public.observations from anon, authenticated;
grant select, insert, delete on public.spots to anon;
grant select, insert, delete on public.observations to anon;

create policy "Public can read spots" on public.spots for select to anon using (true);
create policy "Public can add spots" on public.spots for insert to anon with check (true);
create policy "Public can delete spots" on public.spots for delete to anon using (true);

create policy "Public can read observations" on public.observations for select to anon using (true);
create policy "Public can add observations" on public.observations for insert to anon with check (true);
create policy "Public can delete observations" on public.observations for delete to anon using (true);
