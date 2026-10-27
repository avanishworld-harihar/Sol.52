-- Separate sales ownership from field execution.
-- `organization_members.role` remains the security role (admin/employee).
-- `work_role` describes the person's day-to-day function.

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS work_role text NOT NULL DEFAULT 'office_sales';

ALTER TABLE public.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_work_role_check;
ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_work_role_check
  CHECK (work_role IN ('office_sales', 'field_staff', 'hybrid'));

ALTER TABLE public.organization_invites
  ADD COLUMN IF NOT EXISTS work_role text NOT NULL DEFAULT 'office_sales';

ALTER TABLE public.organization_invites
  DROP CONSTRAINT IF EXISTS organization_invites_work_role_check;
ALTER TABLE public.organization_invites
  ADD CONSTRAINT organization_invites_work_role_check
  CHECK (work_role IN ('office_sales', 'field_staff', 'hybrid'));

CREATE TABLE IF NOT EXISTS public.lead_work_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  assignment_type text NOT NULL DEFAULT 'site_survey'
    CHECK (assignment_type IN ('site_survey', 'document_collection', 'customer_concern', 'follow_up_visit')),
  status text NOT NULL DEFAULT 'assigned'
    CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  instructions text NULL,
  field_notes text NULL,
  due_at timestamptz NULL,
  assigned_by_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_work_assignments_org_assignee_idx
  ON public.lead_work_assignments (organization_id, assigned_user_id, status, due_at);
CREATE INDEX IF NOT EXISTS lead_work_assignments_lead_idx
  ON public.lead_work_assignments (lead_id, status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS lead_work_assignments_one_active_type_idx
  ON public.lead_work_assignments (lead_id, assignment_type)
  WHERE status IN ('assigned', 'accepted', 'in_progress');

DROP TRIGGER IF EXISTS trg_lead_work_assignments_updated_at ON public.lead_work_assignments;
CREATE TRIGGER trg_lead_work_assignments_updated_at
BEFORE UPDATE ON public.lead_work_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_followup_updated_at();

ALTER TABLE public.lead_work_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "field_work_select" ON public.lead_work_assignments;
CREATE POLICY "field_work_select" ON public.lead_work_assignments FOR SELECT TO authenticated
  USING (
    public.sol52_is_org_admin(organization_id)
    OR assigned_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id AND l.assigned_to_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "field_work_admin_or_owner_insert" ON public.lead_work_assignments;
CREATE POLICY "field_work_admin_or_owner_insert" ON public.lead_work_assignments FOR INSERT TO authenticated
  WITH CHECK (
    public.sol52_is_org_admin(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
        AND l.organization_id = organization_id
        AND l.assigned_to_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "field_work_participant_update" ON public.lead_work_assignments;
CREATE POLICY "field_work_participant_update" ON public.lead_work_assignments FOR UPDATE TO authenticated
  USING (
    public.sol52_is_org_admin(organization_id)
    OR assigned_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id AND l.assigned_to_user_id = auth.uid()
    )
  )
  WITH CHECK (public.sol52_is_org_member(organization_id));

COMMENT ON COLUMN public.organization_members.work_role IS
  'Operational function: office_sales, field_staff, or hybrid. Independent from permission role.';
COMMENT ON TABLE public.lead_work_assignments IS
  'Field jobs attached to a lead without changing the lead sales owner.';

-- Extend safe offboarding: sales ownership is handed over and open field jobs
-- separately move to the selected teammate or Team Inbox (NULL).
CREATE OR REPLACE FUNCTION public.sol52_offboard_member(
  p_org_id uuid,
  p_member_id uuid,
  p_actor_user_id uuid,
  p_reassign_to_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_departing_user_id uuid;
  v_departing_role text;
  v_admin_count integer;
  v_leads_moved integer := 0;
  v_projects_moved integer := 0;
  v_field_assignments_moved integer := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = p_actor_user_id AND role = 'company_admin'
  ) THEN
    RAISE EXCEPTION 'Only a company admin can offboard a member.';
  END IF;

  SELECT user_id, role INTO v_departing_user_id, v_departing_role
  FROM public.organization_members
  WHERE id = p_member_id AND organization_id = p_org_id
  FOR UPDATE;

  IF v_departing_user_id IS NULL THEN RAISE EXCEPTION 'Team member not found.'; END IF;
  IF v_departing_user_id = p_actor_user_id THEN RAISE EXCEPTION 'You cannot remove yourself.'; END IF;

  IF v_departing_role = 'company_admin' THEN
    SELECT count(*) INTO v_admin_count FROM public.organization_members
    WHERE organization_id = p_org_id AND role = 'company_admin';
    IF v_admin_count <= 1 THEN RAISE EXCEPTION 'Cannot remove the last company admin.'; END IF;
  END IF;

  IF p_reassign_to_user_id = v_departing_user_id THEN RAISE EXCEPTION 'Choose a different member for handover.'; END IF;
  IF p_reassign_to_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = p_reassign_to_user_id
  ) THEN
    RAISE EXCEPTION 'Handover member does not belong to this organization.';
  END IF;

  UPDATE public.leads SET assigned_to_user_id = p_reassign_to_user_id
  WHERE organization_id = p_org_id AND assigned_to_user_id = v_departing_user_id;
  GET DIAGNOSTICS v_leads_moved = ROW_COUNT;

  UPDATE public.projects SET assigned_to_user_id = p_reassign_to_user_id, updated_at = now()
  WHERE organization_id = p_org_id AND assigned_to_user_id = v_departing_user_id;
  GET DIAGNOSTICS v_projects_moved = ROW_COUNT;

  UPDATE public.lead_work_assignments
  SET assigned_user_id = p_reassign_to_user_id, updated_at = now()
  WHERE organization_id = p_org_id
    AND assigned_user_id = v_departing_user_id
    AND status IN ('assigned', 'accepted', 'in_progress');
  GET DIAGNOSTICS v_field_assignments_moved = ROW_COUNT;

  DELETE FROM public.organization_members
  WHERE id = p_member_id AND organization_id = p_org_id;

  RETURN jsonb_build_object(
    'departing_user_id', v_departing_user_id,
    'reassigned_to_user_id', p_reassign_to_user_id,
    'leads_moved', v_leads_moved,
    'projects_moved', v_projects_moved,
    'field_assignments_moved', v_field_assignments_moved
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sol52_offboard_member(uuid, uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sol52_offboard_member(uuid, uuid, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.sol52_offboard_member(uuid, uuid, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sol52_offboard_member(uuid, uuid, uuid, uuid) TO service_role;
