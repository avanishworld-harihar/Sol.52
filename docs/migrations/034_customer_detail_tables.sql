-- Migration: Customer Detail Tables
-- Creates call_logs and customer_files tables used by the Customer Detail CRM page.
-- Run once in Supabase SQL editor.

-- 1. call_logs: tracks all calls made to a lead
create table if not exists call_logs (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  called_at   timestamptz not null default now(),
  duration_seconds integer not null default 0,
  outcome     text not null default 'answered'
                check (outcome in ('answered','no_answer','busy','voicemail','callback_requested')),
  notes       text,
  created_at  timestamptz not null default now()
);

create index if not exists call_logs_lead_id_idx on call_logs(lead_id);
create index if not exists call_logs_called_at_idx on call_logs(lead_id, called_at desc);

-- 2. customer_files: bills, site images, documents
create table if not exists customer_files (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads(id) on delete cascade,
  file_name    text not null,
  file_url     text not null,
  file_type    text not null default 'document'
                 check (file_type in ('bill','site_image','document')),
  file_size_kb numeric,
  mime_type    text,
  created_at   timestamptz not null default now()
);

create index if not exists customer_files_lead_id_idx on customer_files(lead_id);
create index if not exists customer_files_type_idx on customer_files(lead_id, file_type);

-- RLS: same installer-scoped policy as leads
alter table call_logs enable row level security;
alter table customer_files enable row level security;

-- Allow service role full access (used by admin API)
create policy "service_all_call_logs" on call_logs
  for all using (true) with check (true);

create policy "service_all_customer_files" on customer_files
  for all using (true) with check (true);
