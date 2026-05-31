-- Sol.52 — Backfill legacy pipeline columns on `projects` when Phase 3 was applied
-- before migration 004/005 (capacity_kw, detail, next_action, etc.).

alter table public.projects
  add column if not exists official_name text,
  add column if not exists capacity_kw text,
  add column if not exists detail text,
  add column if not exists status text not null default 'pending',
  add column if not exists install_progress int not null default 0,
  add column if not exists next_action text;

comment on column public.projects.official_name is
  'Name as printed on electricity bill (may differ from leads.name).';
