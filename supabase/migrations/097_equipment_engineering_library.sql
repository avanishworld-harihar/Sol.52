-- Central, versioned equipment engineering library.
-- Only server/service-role code reads or writes this table; proposal rows keep
-- their own immutable engineering snapshot for historical reproducibility.

create table if not exists public.equipment_engineering_libraries (
  scope_key text primary key,
  catalog jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.equipment_engineering_libraries enable row level security;

comment on table public.equipment_engineering_libraries is
  'Versioned manufacturer module/inverter data plus official-source sync state.';

comment on column public.equipment_engineering_libraries.catalog is
  'Validated equipment library JSON. Raw source changes are quarantined before electrical limits change.';
