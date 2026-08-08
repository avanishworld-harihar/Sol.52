-- Org-scoped Brand & Proposals settings (company profile, logo URL, banking, etc.).
-- Logo image files stay in Storage (`installer-branding`); this row stores the URL + profile JSON.
-- APIs use service_role (bypasses RLS) until JWT org policies are wired for this table.

CREATE TABLE IF NOT EXISTS public.org_branding_settings (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS org_branding_settings_updated_idx
  ON public.org_branding_settings (updated_at DESC);

COMMENT ON TABLE public.org_branding_settings IS
  'More → Brand & proposals: company identity, logo URL, banking, display rules (one row per org).';

COMMENT ON COLUMN public.org_branding_settings.settings IS
  'JSON matching client ProposalBrandingSettings (installerName, installerLogoUrl, companyProfile, …).';

ALTER TABLE public.org_branding_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_members_select_branding" ON public.org_branding_settings;
CREATE POLICY "org_members_select_branding"
  ON public.org_branding_settings
  FOR SELECT
  TO authenticated
  USING (public.sol52_is_org_member(organization_id));

DROP POLICY IF EXISTS "org_admins_upsert_branding" ON public.org_branding_settings;
CREATE POLICY "org_admins_upsert_branding"
  ON public.org_branding_settings
  FOR ALL
  TO authenticated
  USING (public.sol52_is_org_admin(organization_id))
  WITH CHECK (public.sol52_is_org_admin(organization_id));
