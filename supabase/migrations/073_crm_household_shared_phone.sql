-- ============================================================
-- Migration 073: CRM household — shared phone, multiple named members
-- ============================================================
-- Family members may share one WhatsApp number or use separate numbers.
-- Each person is a separate `leads` row so both appear in Customers.
-- `household_id` groups them; `is_whatsapp_contact` marks the responsible
-- member for call / WhatsApp actions when the number is shared.

DROP INDEX IF EXISTS public.leads_phone_unique;

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS household_id uuid,
  ADD COLUMN IF NOT EXISTS is_whatsapp_contact boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS leads_phone_lookup_idx
  ON public.leads (lower(phone))
  WHERE phone IS NOT NULL AND length(trim(phone)) > 0;

CREATE INDEX IF NOT EXISTS leads_household_id_idx
  ON public.leads (household_id)
  WHERE household_id IS NOT NULL;

COMMENT ON COLUMN public.leads.household_id IS
  'Shared family / site household. Multiple leads may share one phone under the same household_id.';
COMMENT ON COLUMN public.leads.is_whatsapp_contact IS
  'When true, this member is the primary WhatsApp / call contact for the household (shared number case).';
