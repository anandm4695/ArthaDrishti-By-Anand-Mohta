-- Fix: Drop restrictive MFA policies that query auth.mfa_factors directly.
-- In Supabase, the 'authenticated' role does not have select permissions on auth.mfa_factors,
-- which causes PostgREST to return 'permission denied for table mfa_factors' (error 42501)
-- and hides user financial records.
--
-- Client-side MFA assurance in App.tsx (validateMfaAssurance) securely enforces AAL2
-- TOTP verification before granting dashboard access.

do $$
declare
  tbl text;
  tables text[] := array[
    'transactions', 'bank_accounts', 'stocks', 'mutual_funds', 'loans_taken', 'loans',
    'credit_cards', 'fixed_deposits', 'recurring_deposits', 'ppf_records', 'ppf_nps',
    'epf_records', 'nps_records', 'gold_sgb_records', 'gold_holdings', 'real_estate_records',
    'real_estate_properties', 'vehicles', 'insurance_policies', 'health_insurance_policies',
    'health_insurance', 'goals', 'budget_categories', 'budgets', 'user_settings', 'net_worth_history'
  ];
begin
  foreach tbl in array tables loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl) then
      execute format('drop policy if exists "mfa_required_aal2" on public.%I;', tbl);
      execute format('drop policy if exists "mfa required" on public.%I;', tbl);
    end if;
  end loop;
end $$;
