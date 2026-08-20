-- Add optional inventory tracking column to ingredients.
-- Run this in the Supabase SQL Editor if the in_stock column is missing.

ALTER TABLE IF EXISTS public.ingredients
  ADD COLUMN IF NOT EXISTS in_stock NUMERIC(12, 3) DEFAULT NULL;

COMMENT ON COLUMN public.ingredients.in_stock IS 'Текущий остаток ингредиента на складе (г/мл/шт.)';
