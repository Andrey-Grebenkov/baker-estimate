import { test, expect } from '@playwright/test'

test.describe('Страница авторизации', () => {
  test('отображает форму входа', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Смета/)
    await expect(page.locator('[data-testid="auth-page"]')).toBeVisible()
    await expect(page.locator('[data-testid="auth-title"]')).toHaveText('Калькулятор себестоимости')
    await expect(page.locator('[data-testid="auth-email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="auth-password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="auth-submit-button"]')).toHaveText('Войти')
  })

  test('показывает ошибку при пустых полях', async ({ page }) => {
    await page.goto('/')

    await page.locator('[data-testid="auth-submit-button"]').click()

    const error = page.locator('[data-testid="auth-error"]')
    await expect(error).toBeVisible()
    await expect(error).toHaveText('Введите email и пароль')
  })
})
