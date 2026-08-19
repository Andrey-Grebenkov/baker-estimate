-- Миграция для изоляции данных пользователей (multi-tenancy) в Supabase.
-- Выполните этот скрипт в SQL Editor вашего проекта.
-- Он добавляет user_id в основные таблицы, включает RLS и создаёт политики,
-- разрешающие CRUD-операции только над собственными записями.

-- -----------------------------------------------------------------------------
-- 1. Колонка user_id
-- -----------------------------------------------------------------------------

-- Добавляем user_id, только если колонки ещё нет.
-- Примечание: NOT NULL без DEFAULT корректно сработает только для пустых таблиц
-- или если предварительно заполнить существующие строки.
ALTER TABLE IF EXISTS public.ingredients
  ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.recipes
  ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.cakes
  ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

-- -----------------------------------------------------------------------------
-- 2. Включение Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cakes ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. Политики для ingredients
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 4. Политики для recipes
-- -----------------------------------------------------------------------------
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

-- -----------------------------------------------------------------------------
-- 5. Политики для cakes
-- -----------------------------------------------------------------------------
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
