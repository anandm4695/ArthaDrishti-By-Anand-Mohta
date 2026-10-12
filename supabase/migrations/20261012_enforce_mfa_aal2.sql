-- Migration: Restrictive RLS requiring AAL2 TOTP Multi-Factor Authentication (Audit L1)
-- Uses a SECURITY DEFINER helper function so Postgres can safely check verified factors
-- without throwing Error 42501 (permission denied for table mfa_factors).

create or replace function public.user_has_verified_mfa()
returns boolean
language sql
security definer
set search_path = auth, public
stable
as $$
  select exists (
    select 1 from auth.mfa_factors
    where user_id = auth.uid() and status = 'verified'
  );
$$;

grant execute on function public.user_has_verified_mfa() to authenticated, anon;

do $$
declare
  tbl text;
  tables text[] := array[
    'transactions', 'bank_accounts', 'stocks', 'mutual_funds', 'loans',
    'credit_cards', 'fixed_deposits', 'recurring_deposits', 'ppf_nps',
    'gold_holdings', 'real_estate_properties', 'vehicles', 'health_insurance',
    'goals', 'budgets', 'user_settings', 'net_worth_history'
  ];
begin
  foreach tbl in array tables loop
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = tbl) then
      execute format('drop policy if exists "mfa_required_aal2" on public.%I;', tbl);
      execute format('
        create policy "mfa_required_aal2" on public.%I
          as restrictive to authenticated
          using (
            case
              when public.user_has_verified_mfa() then coalesce((auth.jwt()->>''aal''), ''aal1'') = ''aal2''
              else true
            end
          );
      ', tbl);
    end if;
  end loop;
end $$;
