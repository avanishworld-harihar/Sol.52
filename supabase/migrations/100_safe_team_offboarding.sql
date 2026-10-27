-- Atomic employee offboarding with lead/project handover.
-- Custom app auth uses the service role, so execution is restricted to service_role.

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
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id
      AND user_id = p_actor_user_id
      AND role = 'company_admin'
  ) THEN
    RAISE EXCEPTION 'Only a company admin can offboard a member.';
  END IF;

  SELECT user_id, role
  INTO v_departing_user_id, v_departing_role
  FROM public.organization_members
  WHERE id = p_member_id AND organization_id = p_org_id
  FOR UPDATE;

  IF v_departing_user_id IS NULL THEN
    RAISE EXCEPTION 'Team member not found.';
  END IF;
  IF v_departing_user_id = p_actor_user_id THEN
    RAISE EXCEPTION 'You cannot remove yourself.';
  END IF;

  IF v_departing_role = 'company_admin' THEN
    SELECT count(*) INTO v_admin_count
    FROM public.organization_members
    WHERE organization_id = p_org_id AND role = 'company_admin';
    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot remove the last company admin.';
    END IF;
  END IF;

  IF p_reassign_to_user_id = v_departing_user_id THEN
    RAISE EXCEPTION 'Choose a different member for handover.';
  END IF;
  IF p_reassign_to_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_org_id AND user_id = p_reassign_to_user_id
  ) THEN
    RAISE EXCEPTION 'Handover member does not belong to this organization.';
  END IF;

  UPDATE public.leads
  SET assigned_to_user_id = p_reassign_to_user_id
  WHERE organization_id = p_org_id AND assigned_to_user_id = v_departing_user_id;
  GET DIAGNOSTICS v_leads_moved = ROW_COUNT;

  UPDATE public.projects
  SET assigned_to_user_id = p_reassign_to_user_id,
      updated_at = now()
  WHERE organization_id = p_org_id AND assigned_to_user_id = v_departing_user_id;
  GET DIAGNOSTICS v_projects_moved = ROW_COUNT;

  DELETE FROM public.organization_members
  WHERE id = p_member_id AND organization_id = p_org_id;

  RETURN jsonb_build_object(
    'departing_user_id', v_departing_user_id,
    'reassigned_to_user_id', p_reassign_to_user_id,
    'leads_moved', v_leads_moved,
    'projects_moved', v_projects_moved
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sol52_offboard_member(uuid, uuid, uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sol52_offboard_member(uuid, uuid, uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.sol52_offboard_member(uuid, uuid, uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sol52_offboard_member(uuid, uuid, uuid, uuid) TO service_role;

COMMENT ON FUNCTION public.sol52_offboard_member(uuid, uuid, uuid, uuid) IS
  'Atomically transfers a departing member ownership and removes organization access.';
