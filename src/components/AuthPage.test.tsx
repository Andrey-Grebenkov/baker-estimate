import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AuthPage } from './AuthPage'

describe('AuthPage — consent gate', () => {
  it('блокирует submit без согласия даже при снятом disabled (DevTools bypass)', () => {
    const onSignIn = vi.fn()
    const onSignUp = vi.fn()
    render(<AuthPage error={null} onSignIn={onSignIn} onSignUp={onSignUp} />)

    // Имитируем обход UI: submit формы напрямую, минуя disabled-кнопку
    fireEvent.submit(screen.getByTestId('auth-form'))

    expect(onSignIn).not.toHaveBeenCalled()
    expect(onSignUp).not.toHaveBeenCalled()
    expect(screen.getByTestId('auth-error').textContent).toContain(
      'Необходимо согласие с условиями',
    )
  })

  it('вызывает onSignIn после установки чекбокса согласия', async () => {
    const onSignIn = vi.fn().mockResolvedValue({ error: null })
    render(<AuthPage error={null} onSignIn={onSignIn} onSignUp={vi.fn()} />)

    fireEvent.change(screen.getByTestId('auth-email-input'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByTestId('auth-password-input'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByTestId('auth-consent-checkbox'))
    fireEvent.click(screen.getByTestId('auth-submit-button'))

    await waitFor(() => {
      expect(onSignIn).toHaveBeenCalledWith('user@example.com', 'password123')
    })
  })

  it('открывает модалки документов по ссылкам в чекбоксе', () => {
    render(<AuthPage error={null} onSignIn={vi.fn()} onSignUp={vi.fn()} />)

    fireEvent.click(screen.getByTestId('auth-terms-link'))
    expect(screen.queryByTestId('legal-modal')).not.toBeNull()
    expect(
      screen.getByText('Пользовательское соглашение', { selector: 'h2' }).textContent,
    ).toBeTruthy()

    fireEvent.click(screen.getByTestId('legal-modal-close'))
    expect(screen.queryByTestId('legal-modal')).toBeNull()

    fireEvent.click(screen.getByTestId('auth-privacy-link'))
    expect(
      screen.getByText('Политика обработки персональных данных', { selector: 'h2' })
        .textContent,
    ).toBeTruthy()
  })
})
