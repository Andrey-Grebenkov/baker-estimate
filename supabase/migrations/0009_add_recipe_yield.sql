-- Базовый выход рецепта (фаза 1 замены коэффициента)

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS yield_amount NUMERIC(12, 3) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS yield_unit TEXT NOT NULL DEFAULT 'кг' CHECK (yield_unit IN ('кг', 'шт'));
