-- Базовый выход торта (фаза упрощения сборки)

ALTER TABLE public.cakes
  ADD COLUMN IF NOT EXISTS base_yield_weight NUMERIC(12, 3) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS base_yield_unit TEXT NOT NULL DEFAULT 'кг' CHECK (base_yield_unit IN ('кг', 'шт'));

-- Сохранить текущий рассчитанный вес как пользовательский базовый выход
UPDATE public.cakes
SET base_yield_weight = weight_kg,
    base_yield_unit = 'кг'
WHERE weight_kg IS NOT NULL;
