-- Migration: Restrictive RLS requiring AAL2 TOTP Multi-Factor Authentication (Audit L1)
-- Enforces that users who have enrolled and verified a TOTP factor must possess
-- an 'aal2' JWT claim in their session to query or write financial records.

do $$
declare
  tbl text;
  tables text[] := array[
    'transactions', 'bank_accounts', 'stocks', 'mutual_funds', 'loans_taken',
    'credit_cards', 'fixed_deposits', 'recurring_deposits', 'ppf_records',
    'epf_records', 'nps_records', 'gold_sgb_records', 'real_estate_records',
    'vehicles', 'insurance_policies', 'health_insurance_policies', 'goals',
    'budget_categories', 'user_settings', 'net_worth_history'
  ];
begin
  foreach tbl in array tables loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl) then
      execute format('
        drop policy if exists "mfa_required_aal2" on public.%I;
        create policy "mfa_required_aal2" on public.%I
          as restrictive to authenticated
          using (
            case
              when exists (
                select 1 from auth.mfa_factors
                where user_id = auth.uid() and status = ''verified''
              ) then coalesce((auth.jwt()->>''aal''), ''aal1'') = ''aal2''
              else true
            end
          );
      ', tbl, tbl);
    end if;
  end loop;
end $$;
