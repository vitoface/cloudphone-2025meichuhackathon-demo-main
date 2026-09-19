create table public."GridDensity" (
  grid_key text primary key,
  min_latitude double precision not null,
  max_latitude double precision not null,
  min_longtitude double precision not null,
  max_longtitude double precision not null,
  center_latitude double precision not null,
  center_longtitude double precision not null,
  event_count integer not null check (event_count >= 3),
  dominant_event public.map_event,
  updated_at timestamp with time zone not null default now(),
  refresh_token uuid not null
);

alter table public."GridDensity" enable row level security;

create index grid_density_event_count_idx
on public."GridDensity" (event_count desc);
