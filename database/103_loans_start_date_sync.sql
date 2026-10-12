-- ==============================================================================
-- Migration 103: Sync loans start_date, emi_start_date, and forgiven_date
-- ==============================================================================
-- Ensures that:
-- 1. Loans Taken EMI start dates persist cleanly to Supabase.
-- 2. Loans Given forgiven settlement dates persist cleanly.
-- Safe and idempotent (uses ADD COLUMN IF NOT EXISTS).

ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS emi_start_date date;
ALTER TABLE public.loans ADD COLUMN IF NOT EXISTS forgiven_date date;

COMMENT ON COLUMN public.loans.start_date IS 'Loan disbursement / EMI commencement start date';
COMMENT ON COLUMN public.loans.emi_start_date IS 'Explicit EMI repayment schedule start date';
COMMENT ON COLUMN public.loans.forgiven_date IS 'Date when a loan given balance was settled or written off';
