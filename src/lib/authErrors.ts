interface AuthErrorLike {
  message: string
  code?: string
  name?: string
}

export function isSuppressedAuthError(error: AuthErrorLike | string | null | undefined): boolean {
  if (!error) return false
  const message = typeof error === 'string' ? error : error.message
  return message.toLowerCase().includes('jwt issued at future')
}

export function mapAuthError(error: AuthErrorLike | string | null | undefined): string | null {
  if (!error || isSuppressedAuthError(error)) return null

  const message = typeof error === 'string' ? error : error.message
  const code = typeof error === 'string' ? undefined : error.code
  const name = typeof error === 'string' ? undefined : error.name

  if (code === 'invalid_credentials') {
    return 'Неверный email или пароль'
  }

  if (code === 'user_already_exists') {
    return 'Пользователь с таким email уже существует'
  }

  if (code === 'weak_password') {
    return 'Пароль должен содержать минимум 6 символов'
  }

  if (code === 'email_address_invalid' || code === 'email_not_confirmed') {
    return 'Некорректный email'
  }

  const lower = message.toLowerCase()

  // Fetch failures: Chrome "Failed to fetch", Node "fetch failed",
  // Firefox "NetworkError when attempting to fetch resource.",
  // Safari "Load failed" / "The network connection was lost.",
  // React Native "Network request failed". supabase-js wraps them in
  // AuthRetryableFetchError/AuthUnknownError, keeping the message.
  if (
    name === 'AuthRetryableFetchError' ||
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('network request failed') ||
    lower.includes('network connection') ||
    lower.includes('load failed') ||
    lower.includes('timed out') ||
    lower.includes('timeout') ||
    lower.includes('err_connection')
  ) {
    return 'Проблема с сетью. Проверьте подключение к интернету.'
  }

  if (lower.includes('invalid login credentials')) {
    return 'Неверный email или пароль'
  }

  if (lower.includes('user already registered')) {
    return 'Пользователь с таким email уже существует'
  }

  if (lower.includes('password should be at least 6 characters')) {
    return 'Пароль должен содержать минимум 6 символов'
  }

  if (lower.includes('email_address_invalid') || lower.includes('invalid email')) {
    return 'Некорректный email'
  }

  return 'Произошла ошибка. Попробуйте еще раз.'
}
