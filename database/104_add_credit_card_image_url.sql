-- ==============================================================================
-- Migration 104: Add card_image_url to credit_cards
-- ==============================================================================
-- Stores user-selected or uploaded custom credit card artwork image URL/data.
-- Safe and idempotent (uses ADD COLUMN IF NOT EXISTS).

ALTER TABLE public.credit_cards ADD COLUMN IF NOT EXISTS card_image_url text DEFAULT '';

COMMENT ON COLUMN public.credit_cards.card_image_url IS 'Custom card image URL, preset artwork asset, or compressed data URL';
