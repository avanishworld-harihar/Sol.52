-- ============================================================
-- Migration 035 — CRM Phase 2
-- Run once in Supabase SQL editor.
-- ============================================================

-- 1. consumer_name on leads
--    Lead name = person we spoke with.
--    Consumer name = name on electricity bill.
alter table leads add column if not exists consumer_name text;
create index if not exists leads_consumer_name_idx on leads(consumer_name) where consumer_name is not null;

-- 2. Update call_logs outcome constraint to CRM Phase-2 values.
--    Drop old constraint first (if it exists), then add the new one.
alter table call_logs drop constraint if exists call_logs_outcome_check;
alter table call_logs add constraint call_logs_outcome_check
  check (outcome in (
    'answered',          -- legacy / generic answered
    'no_answer',
    'busy',
    'voicemail',
    'callback_requested',
    'interested',
    'followup_required',
    'proposal_sent',
    'not_interested'
  ));

-- 3. pipeline_history table — stores every stage transition
create table if not exists pipeline_history (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  from_stage  text not null,
  to_stage    text not null,
  changed_at  timestamptz not null default now(),
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists pipeline_history_lead_id_idx on pipeline_history(lead_id, changed_at desc);

alter table pipeline_history enable row level security;
create policy "service_all_pipeline_history" on pipeline_history
  for all using (true) with check (true);

-- 4. Add new event types to activity_events type check (if any).
--    activity_events uses a text column — no enum constraint to change.
--    New event_type values used in code:
--      lead_created, lead_edited, call_logged, file_uploaded,
--      pipeline_stage_changed (alias for status_changed used in timeline)
--    No DB change needed; event_type is unconstrained text.

-- 5. Helper view: next pending followup per lead (used by the CRM list API).
create or replace view lead_next_followup as
  select distinct on (lead_id)
    lead_id,
    id        as reminder_id,
    title,
    due_at,
    priority,
    followup_type
  from followup_reminders
  where status = 'pending'
  order by lead_id, due_at asc;

-- 6. Helper view: latest activity per lead (used by CRM list API).
create or replace view lead_last_activity as
  select distinct on (lead_id)
    lead_id,
    event_type,
    occurred_at
  from activity_events
  order by lead_id, occurred_at desc;
