-- Схема Supabase для baker-estimate.
-- Выполните этот скрипт в SQL Editor вашего проекта Supabase.
-- Он создаёт таблицы под текущие TypeScript-интерфейсы,
-- добавляет user_id, JSONB для вложенных массивов/объектов,
-- включает Row Level Security и задаёт права только на собственные записи.

-- -----------------------------------------------------------------------------
-- Ингредиенты
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  price_per_package NUMERIC(12, 2) NOT NULL,
  package_quantity NUMERIC(12, 3) NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('g', 'ml', 'pcs')),
  price_per_base_unit NUMERIC(12, 6) NOT NULL,
  in_stock NUMERIC(12, 3) DEFAULT NULL,

  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.ingredients IS 'Базовые купленные продукты';

-- -----------------------------------------------------------------------------
-- Рецепты / полуфабрикаты
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,

  total_weight NUMERIC(12, 3) NOT NULL DEFAULT 0,
  total_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.recipes IS 'Рецепты и полуфабрикаты';
COMMENT ON COLUMN public.recipes.ingredients IS 'Массив RecipeIngredient: [{ingredientId, quantityUsed}]';

-- -----------------------------------------------------------------------------
-- Торты
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,

  recipes JSONB NOT NULL DEFAULT '[]'::jsonb,
  packaging JSONB NOT NULL DEFAULT '[]'::jsonb,
  decor JSONB NOT NULL DEFAULT '[]'::jsonb,
  overheads JSONB NOT NULL DEFAULT '{}'::jsonb,

  margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,

  -- Рассчитываемые поля
  total_ingredients_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_packaging_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_decor_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_overheads_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  final_cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  recommended_price NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Дополнительные метрики из CakeDetails
  weight_kg NUMERIC(12, 3) NOT NULL DEFAULT 0,
  cost_per_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,
  recommended_price_per_kg NUMERIC(12, 2) NOT NULL DEFAULT 0,

  image_url TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.cakes IS 'Итоговые торты';
COMMENT ON COLUMN public.cakes.recipes IS 'Массив CakeRecipeItem: [{recipeId, multiplier}]';
COMMENT ON COLUMN public.cakes.packaging IS 'Массив CakeAdditionalItem: [{id, name, cost, quantity}]';
COMMENT ON COLUMN public.cakes.decor IS 'Массив CakeAdditionalItem: [{id, name, cost, quantity}]';
COMMENT ON COLUMN public.cakes.overheads IS 'Объект Overheads: {workHours, hourlyRate, fixedCosts}';

-- -----------------------------------------------------------------------------
-- Триггер для автоматической подстановки user_id при вставке
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_ingredients_user_id ON public.ingredients;
CREATE TRIGGER set_ingredients_user_id
  BEFORE INSERT ON public.ingredients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_recipes_user_id ON public.recipes;
CREATE TRIGGER set_recipes_user_id
  BEFORE INSERT ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

DROP TRIGGER IF EXISTS set_cakes_user_id ON public.cakes;
CREATE TRIGGER set_cakes_user_id
  BEFORE INSERT ON public.cakes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cakes ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS: пользователь видит и управляет только своими записями
-- -----------------------------------------------------------------------------

-- ingredients
DROP POLICY IF EXISTS "Users can select own ingredients" ON public.ingredients;
CREATE POLICY "Users can select own ingredients"
  ON public.ingredients
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own ingredients" ON public.ingredients;
CREATE POLICY "Users can insert own ingredients"
  ON public.ingredients
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own ingredients" ON public.ingredients;
CREATE POLICY "Users can update own ingredients"
  ON public.ingredients
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own ingredients" ON public.ingredients;
CREATE POLICY "Users can delete own ingredients"
  ON public.ingredients
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- recipes
DROP POLICY IF EXISTS "Users can select own recipes" ON public.recipes;
CREATE POLICY "Users can select own recipes"
  ON public.recipes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own recipes" ON public.recipes;
CREATE POLICY "Users can insert own recipes"
  ON public.recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;
CREATE POLICY "Users can update own recipes"
  ON public.recipes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own recipes" ON public.recipes;
CREATE POLICY "Users can delete own recipes"
  ON public.recipes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- cakes
DROP POLICY IF EXISTS "Users can select own cakes" ON public.cakes;
CREATE POLICY "Users can select own cakes"
  ON public.cakes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own cakes" ON public.cakes;
CREATE POLICY "Users can insert own cakes"
  ON public.cakes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own cakes" ON public.cakes;
CREATE POLICY "Users can update own cakes"
  ON public.cakes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own cakes" ON public.cakes;
CREATE POLICY "Users can delete own cakes"
  ON public.cakes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Заказы / продажи
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cake_id UUID REFERENCES public.cakes(id) ON DELETE SET NULL,

  client_name TEXT NOT NULL,
  delivery_date TIMESTAMPTZ NOT NULL,
  actual_weight_kg NUMERIC(12, 3) NOT NULL DEFAULT 0,
  actual_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.orders IS 'Заказы и продажи (модуль Учет)';

DROP TRIGGER IF EXISTS set_orders_user_id ON public.orders;
CREATE TRIGGER set_orders_user_id
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own orders" ON public.orders;
CREATE POLICY "Users can select own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own orders" ON public.orders;
CREATE POLICY "Users can delete own orders"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Supabase Storage: bucket for cake photos
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('cake-images', 'cake-images', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

create policy "Public cake images can be viewed"
  on storage.objects
  for select
  to public
  using (bucket_id = 'cake-images');

create policy "Authenticated users can insert cake images"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'cake-images');

create policy "Authenticated users can update own cake images"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'cake-images' and owner = auth.uid())
  with check (bucket_id = 'cake-images');

create policy "Authenticated users can delete own cake images"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'cake-images' and owner = auth.uid());
