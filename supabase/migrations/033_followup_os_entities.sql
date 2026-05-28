-- Follow-up OS core entities: reminders, notes, visits, timeline events

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  event_type text not null,
  occurred_at timestamptz not null default now(),
  actor_type text not null default 'user',
  actor_id text null,
  meta_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_events_lead_occurred
  on public.activity_events (lead_id, occurred_at desc);
create index if not exists idx_activity_events_type
  on public.activity_events (event_type, occurred_at desc);

create table if not exists public.followup_reminders (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  proposal_id uuid null references public.proposals(id) on delete set null,
  project_id uuid null references public.projects(id) on delete set null,
  title text not null,
  followup_type text not null default 'general',
  priority text not null default 'medium',
  due_at timestamptz not null,
  status text not null default 'pending',
  snoozed_until timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz null,
  external_calendar_ref text null,
  constraint chk_followup_priority check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint chk_followup_status check (status in ('pending', 'completed', 'snoozed'))
);

create index if not exists idx_followup_reminders_lead_due
  on public.followup_reminders (lead_id, due_at asc);
create index if not exists idx_followup_reminders_status_due
  on public.followup_reminders (status, due_at asc);
create index if not exists idx_followup_reminders_visit_due
  on public.followup_reminders (followup_type, due_at asc);

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  body_text text not null default '',
  attachments_json jsonb not null default '[]'::jsonb,
  voice_ref text null,
  sketch_ref text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_lead_notes_lead_created
  on public.lead_notes (lead_id, created_at desc);

create table if not exists public.lead_visits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  proposal_id uuid null references public.proposals(id) on delete set null,
  scheduled_at timestamptz not null,
  visit_status text not null default 'scheduled',
  summary text null,
  location text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_visit_status check (visit_status in ('scheduled', 'completed', 'cancelled', 'rescheduled'))
);

create index if not exists idx_lead_visits_lead_scheduled
  on public.lead_visits (lead_id, scheduled_at desc);
create index if not exists idx_lead_visits_status_scheduled
  on public.lead_visits (visit_status, scheduled_at asc);

create or replace function public.set_followup_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_followup_reminders_updated_at on public.followup_reminders;
create trigger trg_followup_reminders_updated_at
before update on public.followup_reminders
for each row execute function public.set_followup_updated_at();

drop trigger if exists trg_lead_notes_updated_at on public.lead_notes;
create trigger trg_lead_notes_updated_at
before update on public.lead_notes
for each row execute function public.set_followup_updated_at();

drop trigger if exists trg_lead_visits_updated_at on public.lead_visits;
create trigger trg_lead_visits_updated_at
before update on public.lead_visits
for each row execute function public.set_followup_updated_at();
