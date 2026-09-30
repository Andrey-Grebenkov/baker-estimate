import { describe, it, expect } from 'vitest'
import { mapAuthError, isSuppressedAuthError } from './authErrors'

describe('mapAuthError — сетевые ошибки', () => {
  it('мапит "Failed to fetch" (Chrome/AuthRetryableFetchError)', () => {
    expect(mapAuthError({ message: 'Failed to fetch' })).toBe(
      'Проблема с сетью. Проверьте подключение к интернету.',
    )
  })

  it('мапит по имени AuthRetryableFetchError', () => {
    expect(
      mapAuthError({ name: 'AuthRetryableFetchError', message: 'whatever' }),
    ).toBe('Проблема с сетью. Проверьте подключение к интернету.')
  })

  it('мапит варианты из разных браузеров и рантаймов', () => {
    const variants = [
      'fetch failed',
      'NetworkError when attempting to fetch resource.',
      'Network request failed',
      'Load failed',
      'The network connection was lost.',
      'Request timed out',
      'ERR_CONNECTION_TIMED_OUT',
      'Network Error',
    ]
    for (const message of variants) {
      expect(mapAuthError({ message }), message).toBe(
        'Проблема с сетью. Проверьте подключение к интернету.',
      )
    }
  })

  it('мапит строковые сетевые ошибки', () => {
    expect(mapAuthError('Failed to fetch')).toBe(
      'Проблема с сетью. Проверьте подключение к интернету.',
    )
  })
})

describe('mapAuthError — известные ошибки Supabase', () => {
  it('invalid_credentials по коду', () => {
    expect(mapAuthError({ code: 'invalid_credentials', message: 'x' })).toBe(
      'Неверный email или пароль',
    )
  })

  it('"Invalid login credentials" по сообщению', () => {
    expect(mapAuthError({ message: 'Invalid login credentials' })).toBe(
      'Неверный email или пароль',
    )
  })

  it('"User already registered" по сообщению', () => {
    expect(mapAuthError({ message: 'User already registered' })).toBe(
      'Пользователь с таким email уже существует',
    )
  })

  it('неизвестная ошибка -> общий fallback', () => {
    expect(mapAuthError({ message: 'Some unexpected supabase error' })).toBe(
      'Произошла ошибка. Попробуйте еще раз.',
    )
    expect(mapAuthError('weird raw string')).toBe(
      'Произошла ошибка. Попробуйте еще раз.',
    )
  })

  it('null/undefined -> null', () => {
    expect(mapAuthError(null)).toBeNull()
    expect(mapAuthError(undefined)).toBeNull()
  })
})

describe('isSuppressedAuthError', () => {
  it('подавляет "jwt issued at future"', () => {
    expect(
      isSuppressedAuthError({ message: 'JWT issued at future' }),
    ).toBe(true)
    expect(mapAuthError({ message: 'JWT issued at future' })).toBeNull()
  })
})
