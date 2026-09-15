-- Настройки пользователя: ставка налога (%) для модуля "Учет".
-- Выполните этот скрипт в SQL Editor вашего проекта Supabase.

-- -----------------------------------------------------------------------------
-- Персональные настройки пользователя
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.user_settings IS 'Персональные настройки пользователя';
COMMENT ON COLUMN public.user_settings.tax_percent IS 'Ставка налога в процентах от выручки; 0 — налог не учитывается';

-- Автоматическая подстановка user_id
DROP TRIGGER IF EXISTS set_user_settings_user_id ON public.user_settings;
CREATE TRIGGER set_user_settings_user_id
  BEFORE INSERT ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select own settings" ON public.user_settings;
CREATE POLICY "Users can select own settings"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
