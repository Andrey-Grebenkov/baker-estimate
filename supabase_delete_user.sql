-- Функция для удаления текущего авторизованного пользователя.
-- Выполните этот скрипт в SQL Editor проекта Supabase, чтобы
-- фронтенд мог вызывать `await supabase.rpc('delete_user')`.

CREATE OR REPLACE FUNCTION delete_user()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$DELETE FROM auth.users WHERE id = auth.uid();$$;
