-- Создание таблицы заказов / продаж (модуль "Учет").
-- Выполните этот скрипт в SQL Editor вашего проекта Supabase.

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

-- Автоматическая подстановка user_id
DROP TRIGGER IF EXISTS set_orders_user_id ON public.orders;
CREATE TRIGGER set_orders_user_id
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
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
