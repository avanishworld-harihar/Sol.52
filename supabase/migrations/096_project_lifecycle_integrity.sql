-- Projects CRM lifecycle integrity
-- Separates pre-sale workspaces from operational projects and makes completion durable.

alter table public.projects
  add column if not exists record_type text not null default 'operational',
  add column if not exists project_origin text not null default 'legacy';

alter table public.projects drop constraint if exists projects_record_type_check;
alter table public.projects add constraint projects_record_type_check
  check (record_type in ('operational', 'draft'));

alter table public.projects drop constraint if exists projects_project_origin_check;
alter table public.projects add constraint projects_project_origin_check
  check (project_origin in ('legacy', 'manual', 'crm_won', 'design_workspace', 'proposal', 'imported'));

-- Existing hidden pre-sale rows become drafts. Completed work is always operational.
update public.projects
set record_type = case
    when current_stage = 'completed' or actual_completion is not null or stage_status = 'done'
      then 'operational'
    when dashboard_visible = false and archived_at is null
      then 'draft'
    else 'operational'
  end,
  updated_at = coalesce(updated_at, now());

-- Known completed installation that was hidden by the legacy lead-status repair.
update public.projects
set current_stage = 'completed',
    stage_status = 'done',
    status = 'done',
    install_progress = 100,
    actual_completion = coalesce(actual_completion, updated_at::date, current_date),
    dashboard_visible = true,
    record_type = 'operational',
    project_origin = 'legacy',
    updated_at = now()
where id = '3cfd6369-4d9a-45d3-8c90-008de6c62a46';

update public.leads
set status = 'won'
where id = 'eead2c0a-8f20-4c7a-8128-ce8fff874834';

create index if not exists projects_lifecycle_view_updated_idx
  on public.projects (record_type, dashboard_visible, updated_at desc)
  where archived_at is null;

create index if not exists projects_completed_updated_idx
  on public.projects (actual_completion desc, updated_at desc)
  where archived_at is null and record_type = 'operational';

create index if not exists projects_org_lifecycle_stage_idx
  on public.projects (organization_id, record_type, current_stage, updated_at desc);

-- One operational project per CRM customer. Draft workspaces reuse/convert into it.
create unique index if not exists projects_one_operational_per_lead_idx
  on public.projects (lead_id)
  where lead_id is not null and record_type = 'operational' and archived_at is null;
