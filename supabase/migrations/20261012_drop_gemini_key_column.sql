-- Migration: Remove plain-text Gemini API key column from user_settings (Audit L2)
-- AI operations are now handled server-side via /api/ai or ephemeral in-memory session.

alter table public.user_settings drop column if exists gemini_api_key;
