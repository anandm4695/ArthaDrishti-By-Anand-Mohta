-- Migration: Shared API Rate Limits (Audit S2)
-- Enables distributed rate limiting across concurrent serverless lambda instances

create table if not exists public.api_rate_limits (
  key text primary key,
  count int not null default 1,
  reset_at bigint not null,
  updated_at timestamptz default now()
);

-- Index for fast lookups and automated cleanup
create index if not exists idx_api_rate_limits_reset on public.api_rate_limits (reset_at);

-- Restrict anonymous access to rate limit tracking table
revoke all on public.api_rate_limits from anon;
grant all on public.api_rate_limits to service_role;
