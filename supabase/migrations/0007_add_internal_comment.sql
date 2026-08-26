-- Внутренние заметки к заказам

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS internal_comment TEXT;
