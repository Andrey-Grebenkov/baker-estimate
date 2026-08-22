-- Add completion_comment to orders for recording overpayment reasons.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS completion_comment TEXT;

COMMENT ON COLUMN public.orders.completion_comment IS 'Причина переплаты при выдаче заказа (например, доставка, чаевые)';
