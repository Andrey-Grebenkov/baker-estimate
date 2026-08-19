interface AuthErrorLike {
  message: string
  code?: string
}

export function mapAuthError(error: AuthErrorLike | string | null | undefined): string | null {
  if (!error) return null

  const message = typeof error === 'string' ? error : error.message
  const code = typeof error === 'string' ? undefined : error.code

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

  return message
}
