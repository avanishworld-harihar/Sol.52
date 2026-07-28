-- Wave 2: phone invites into an organization (company_admin invites employees).
-- Accepted on OTP login when phone matches a pending invite.

CREATE TABLE IF NOT EXISTS public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  phone_e164 text NOT NULL,
  phone_digits text NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('company_admin', 'employee')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'cancelled', 'expired')),
  invited_by_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  accepted_user_id uuid NULL REFERENCES auth.users (id) ON DELETE SET NULL,
  note text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,
  accepted_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS organization_invites_org_status_idx
  ON public.organization_invites (organization_id, status);

CREATE INDEX IF NOT EXISTS organization_invites_phone_pending_idx
  ON public.organization_invites (phone_digits, status)
  WHERE status = 'pending';

-- One pending invite per org+phone
CREATE UNIQUE INDEX IF NOT EXISTS organization_invites_org_phone_pending_unique
  ON public.organization_invites (organization_id, phone_digits)
  WHERE status = 'pending';

COMMENT ON TABLE public.organization_invites IS
  'Pending team invites by phone. Accepted during OTP login (Wave 2).';

ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
