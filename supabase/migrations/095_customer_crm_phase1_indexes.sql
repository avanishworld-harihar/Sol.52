-- Customer CRM Phase 1 — paginated list, fast search and summary lookups.

create extension if not exists pg_trgm;

create index if not exists idx_leads_org_created
  on public.leads (organization_id, created_at desc);

create index if not exists idx_leads_org_status_created
  on public.leads (organization_id, status, created_at desc);

create index if not exists idx_leads_org_last_touched
  on public.leads (organization_id, last_touched_at desc nulls last, created_at desc);

create index if not exists idx_leads_org_monthly_bill
  on public.leads (organization_id, monthly_bill desc, created_at desc);

create index if not exists idx_leads_org_name
  on public.leads (organization_id, lower(name));

create index if not exists idx_leads_name_trgm
  on public.leads using gin (lower(name) gin_trgm_ops);

create index if not exists idx_leads_consumer_name_trgm
  on public.leads using gin (lower(coalesce(consumer_name, '')) gin_trgm_ops);

create index if not exists idx_leads_city_trgm
  on public.leads using gin (lower(city) gin_trgm_ops);

create index if not exists idx_leads_location_trgm
  on public.leads using gin (lower(coalesce(location, '')) gin_trgm_ops);

create index if not exists idx_leads_phone_trgm
  on public.leads using gin (coalesce(phone, '') gin_trgm_ops);

create index if not exists idx_followup_pending_lead_due
  on public.followup_reminders (lead_id, due_at asc)
  where status = 'pending';

create index if not exists idx_proposals_lead_generated
  on public.proposals (lead_id, generated_at desc)
  where lead_id is not null;
