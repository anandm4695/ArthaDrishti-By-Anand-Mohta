-- Migration: Ensure unique constraint on (user_id, month) for net_worth_history (Audit L5)
-- Resolves POST net_worth_history?on_conflict=user_id,month 400 Bad Request error

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'net_worth_history_user_month_key'
  ) then
    alter table public.net_worth_history
      add constraint net_worth_history_user_month_key unique (user_id, month);
  end if;
end $$;
