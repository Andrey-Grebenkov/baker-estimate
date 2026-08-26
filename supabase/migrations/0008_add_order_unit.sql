-- Единица измерения для заказов (кг/шт)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'кг';
