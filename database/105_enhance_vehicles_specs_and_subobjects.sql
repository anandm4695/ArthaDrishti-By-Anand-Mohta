-- ================================================================
-- Migration 105: Enhance Vehicles Specs & Sub-Objects
-- Ensures extended specifications, transmission, emission standards,
-- financing/EMI details, Fastag details, current valuation, and
-- document/photo URLs exist in Supabase public.vehicles table.
--
-- Safe and idempotent (uses ADD COLUMN IF NOT EXISTS).
-- ================================================================

ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS transmission text DEFAULT 'manual';
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS emission_standard text DEFAULT '';
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fuel_efficiency numeric(6,2);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fuel_capacity numeric(6,2);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS puc_number text DEFAULT '';

-- Financing & Loan Details
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS is_financed boolean DEFAULT false;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS loan_account_number text DEFAULT '';
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS loan_amount numeric(14,2);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS loan_emi numeric(14,2);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS loan_tenure_months integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS loan_interest_rate numeric(6,2);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS loan_outstanding numeric(14,2);

-- Fastag & Roadside Assistance
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fastag_provider text DEFAULT '';
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fastag_id text DEFAULT '';
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fastag_balance numeric(10,2);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS warranty_expiry date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS extended_warranty_expiry date;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS rsa_provider text DEFAULT '';
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS rsa_contact_number text DEFAULT '';

-- Valuation & Document Assets
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS current_valuation numeric(14,2);
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS photo_url text DEFAULT '';
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS tax_invoice_url text DEFAULT '';
