-- Trial period for monetization: verified emails get a trial end date.
-- The Vercel backend writes now() + 60 days on successful OTP verification;
-- a far-future value acts as an admin-granted premium override.
-- Run this script in the Supabase SQL Editor.

ALTER TABLE public.verified_emails
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

COMMENT ON COLUMN public.verified_emails.trial_ends_at IS 'Конец пробного периода/подписки. NULL — без ограничения (legacy), далёкая дата — ручной Premium.';

-- Опционально: подарить уже верифицированным пользователям 60 дней с момента их верификации.
-- UPDATE public.verified_emails
-- SET trial_ends_at = verified_at + INTERVAL '60 days'
-- WHERE trial_ends_at IS NULL;
