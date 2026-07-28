-- Wave 3 (Phase C): org membership helpers + RLS policies for JWT path.
-- App APIs still use service_role (bypasses RLS) — isolation is enforced in
-- lib/auth/org-scope.ts. These policies prepare authenticated client access
-- and do NOT drop existing anon policies yet (would break legacy soft mode).

CREATE OR REPLACE FUNCTION public.sol52_is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = p_org_id
      AND m.user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.sol52_is_org_member(uuid) IS
  'True when auth.uid() is a member of the given organization.';

CREATE OR REPLACE FUNCTION public.sol52_is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members m
    WHERE m.organization_id = p_org_id
      AND m.user_id = auth.uid()
      AND m.role = 'company_admin'
  );
$$;

-- Organizations: members can read their org
DROP POLICY IF EXISTS "org_members_select_own" ON public.organizations;
CREATE POLICY "org_members_select_own"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (public.sol52_is_org_member(id));

DROP POLICY IF EXISTS "org_members_select_membership" ON public.organization_members;
CREATE POLICY "org_members_select_membership"
  ON public.organization_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.sol52_is_org_member(organization_id));

DROP POLICY IF EXISTS "org_admins_insert_membership" ON public.organization_members;
CREATE POLICY "org_admins_insert_membership"
  ON public.organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.sol52_is_org_admin(organization_id));

-- Core CRM / projects / proposals — authenticated org scope (additive)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "org_members_select_leads" ON public.leads';
    EXECUTE $p$
      CREATE POLICY "org_members_select_leads"
        ON public.leads FOR SELECT TO authenticated
        USING (organization_id IS NOT NULL AND public.sol52_is_org_member(organization_id))
    $p$;
    EXECUTE 'DROP POLICY IF EXISTS "org_members_insert_leads" ON public.leads';
    EXECUTE $p$
      CREATE POLICY "org_members_insert_leads"
        ON public.leads FOR INSERT TO authenticated
        WITH CHECK (organization_id IS NOT NULL AND public.sol52_is_org_member(organization_id))
    $p$;
    EXECUTE 'DROP POLICY IF EXISTS "org_members_update_leads" ON public.leads';
    EXECUTE $p$
      CREATE POLICY "org_members_update_leads"
        ON public.leads FOR UPDATE TO authenticated
        USING (organization_id IS NOT NULL AND public.sol52_is_org_member(organization_id))
        WITH CHECK (organization_id IS NOT NULL AND public.sol52_is_org_member(organization_id))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "org_members_select_projects" ON public.projects';
    EXECUTE $p$
      CREATE POLICY "org_members_select_projects"
        ON public.projects FOR SELECT TO authenticated
        USING (organization_id IS NOT NULL AND public.sol52_is_org_member(organization_id))
    $p$;
    EXECUTE 'DROP POLICY IF EXISTS "org_members_mutate_projects" ON public.projects';
    EXECUTE $p$
      CREATE POLICY "org_members_mutate_projects"
        ON public.projects FOR ALL TO authenticated
        USING (organization_id IS NOT NULL AND public.sol52_is_org_member(organization_id))
        WITH CHECK (organization_id IS NOT NULL AND public.sol52_is_org_member(organization_id))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'proposals' AND column_name = 'organization_id'
  ) THEN
    EXECUTE 'ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "org_members_select_proposals" ON public.proposals';
    EXECUTE $p$
      CREATE POLICY "org_members_select_proposals"
        ON public.proposals FOR SELECT TO authenticated
        USING (organization_id IS NOT NULL AND public.sol52_is_org_member(organization_id))
    $p$;
    EXECUTE 'DROP POLICY IF EXISTS "org_members_mutate_proposals" ON public.proposals';
    EXECUTE $p$
      CREATE POLICY "org_members_mutate_proposals"
        ON public.proposals FOR ALL TO authenticated
        USING (organization_id IS NOT NULL AND public.sol52_is_org_member(organization_id))
        WITH CHECK (organization_id IS NOT NULL AND public.sol52_is_org_member(organization_id))
    $p$;
  END IF;
END $$;

-- Invites: org admins manage
DO $$
BEGIN
  IF to_regclass('public.organization_invites') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "org_admins_select_invites" ON public.organization_invites';
    EXECUTE $p$
      CREATE POLICY "org_admins_select_invites"
        ON public.organization_invites FOR SELECT TO authenticated
        USING (public.sol52_is_org_admin(organization_id))
    $p$;
  END IF;
END $$;
