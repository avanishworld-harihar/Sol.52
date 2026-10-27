-- Employee-level CRM/project isolation.
-- Company admins can see and manage every row in their organization; employees
-- can only access rows assigned to their auth user.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS assigned_to_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS assigned_to_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS leads_org_assignee_idx
  ON public.leads (organization_id, assigned_to_user_id);
CREATE INDEX IF NOT EXISTS projects_org_assignee_idx
  ON public.projects (organization_id, assigned_to_user_id);

CREATE OR REPLACE FUNCTION public.sol52_can_access_owned_row(p_org_id uuid, p_assignee uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.sol52_is_org_admin(p_org_id)
    OR (
      public.sol52_is_org_member(p_org_id)
      AND p_assignee IS NOT NULL
      AND p_assignee = auth.uid()
    );
$$;

DROP POLICY IF EXISTS "org_members_select_leads" ON public.leads;
DROP POLICY IF EXISTS "org_members_insert_leads" ON public.leads;
DROP POLICY IF EXISTS "org_members_update_leads" ON public.leads;
DROP POLICY IF EXISTS "org_owned_select_leads" ON public.leads;
DROP POLICY IF EXISTS "org_owned_insert_leads" ON public.leads;
DROP POLICY IF EXISTS "org_owned_update_leads" ON public.leads;
DROP POLICY IF EXISTS "org_owned_delete_leads" ON public.leads;

CREATE POLICY "org_owned_select_leads" ON public.leads FOR SELECT TO authenticated
  USING (public.sol52_can_access_owned_row(organization_id, assigned_to_user_id));
CREATE POLICY "org_owned_insert_leads" ON public.leads FOR INSERT TO authenticated
  WITH CHECK (
    public.sol52_is_org_member(organization_id)
    AND (public.sol52_is_org_admin(organization_id) OR assigned_to_user_id = auth.uid())
  );
CREATE POLICY "org_owned_update_leads" ON public.leads FOR UPDATE TO authenticated
  USING (public.sol52_can_access_owned_row(organization_id, assigned_to_user_id))
  WITH CHECK (public.sol52_can_access_owned_row(organization_id, assigned_to_user_id));
CREATE POLICY "org_owned_delete_leads" ON public.leads FOR DELETE TO authenticated
  USING (public.sol52_can_access_owned_row(organization_id, assigned_to_user_id));

DROP POLICY IF EXISTS "org_members_select_projects" ON public.projects;
DROP POLICY IF EXISTS "org_members_mutate_projects" ON public.projects;
DROP POLICY IF EXISTS "org_owned_select_projects" ON public.projects;
DROP POLICY IF EXISTS "org_owned_insert_projects" ON public.projects;
DROP POLICY IF EXISTS "org_owned_update_projects" ON public.projects;
DROP POLICY IF EXISTS "org_owned_delete_projects" ON public.projects;

CREATE POLICY "org_owned_select_projects" ON public.projects FOR SELECT TO authenticated
  USING (public.sol52_can_access_owned_row(organization_id, assigned_to_user_id));
CREATE POLICY "org_owned_insert_projects" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    public.sol52_is_org_member(organization_id)
    AND (public.sol52_is_org_admin(organization_id) OR assigned_to_user_id = auth.uid())
  );
CREATE POLICY "org_owned_update_projects" ON public.projects FOR UPDATE TO authenticated
  USING (public.sol52_can_access_owned_row(organization_id, assigned_to_user_id))
  WITH CHECK (public.sol52_can_access_owned_row(organization_id, assigned_to_user_id));
CREATE POLICY "org_owned_delete_projects" ON public.projects FOR DELETE TO authenticated
  USING (public.sol52_can_access_owned_row(organization_id, assigned_to_user_id));

COMMENT ON COLUMN public.leads.assigned_to_user_id IS
  'Auth user responsible for this lead. Employees only see their assigned rows.';
COMMENT ON COLUMN public.projects.assigned_to_user_id IS
  'Auth user responsible for this project. Employees only see their assigned rows.';
