-- Unified agenda: callbacks may remain customer-linked, while operators can
-- also create a general reminder without inventing a fake customer.

alter table if exists public.followup_reminders
  alter column lead_id drop not null;

alter table if exists public.followup_reminders
  add column if not exists organization_id uuid null references public.organizations(id) on delete cascade,
  add column if not exists subject_type text not null default 'customer',
  add column if not exists subject_label text null;

update public.followup_reminders r
set organization_id = l.organization_id,
    subject_type = 'customer'
from public.leads l
where r.lead_id = l.id
  and r.organization_id is null;

-- Historical "Edit callback" created another pending row. Keep the newest
-- active call reminder per customer and close older duplicates.
with ranked_callbacks as (
  select id,
         row_number() over (
           partition by lead_id
           order by created_at desc, due_at desc, id desc
         ) as row_num
  from public.followup_reminders
  where lead_id is not null
    and status = 'pending'
    and followup_type = 'call'
)
update public.followup_reminders r
set status = 'completed',
    completed_at = coalesce(r.completed_at, now()),
    updated_at = now()
from ranked_callbacks ranked
where r.id = ranked.id
  and ranked.row_num > 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'chk_followup_subject_type'
  ) then
    alter table public.followup_reminders
      add constraint chk_followup_subject_type
      check (subject_type in ('customer', 'project', 'general'));
  end if;
end $$;

create index if not exists idx_followup_reminders_org_status_due
  on public.followup_reminders (organization_id, status, due_at asc);

create index if not exists idx_followup_reminders_general_due
  on public.followup_reminders (subject_type, status, due_at asc)
  where lead_id is null;

comment on column public.followup_reminders.subject_type is
  'customer, project, or general. General reminders do not require a lead.';
