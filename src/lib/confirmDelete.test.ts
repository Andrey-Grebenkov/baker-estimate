import { afterEach, describe, expect, it, vi } from 'vitest'
import { confirmDelete } from './confirmDelete'

const MESSAGE =
  'Вы уверены, что хотите удалить этот элемент? Это действие нельзя отменить.'

describe('confirmDelete', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls the action and returns true when the user confirms', () => {
    const action = vi.fn()
    const confirmMock = vi.fn(() => true)
    vi.stubGlobal('window', { confirm: confirmMock })

    const result = confirmDelete(action)

    expect(result).toBe(true)
    expect(confirmMock).toHaveBeenCalledWith(MESSAGE)
    expect(action).toHaveBeenCalledOnce()
  })

  it('does not call the action and returns false when the user cancels', () => {
    const action = vi.fn()
    const confirmMock = vi.fn(() => false)
    vi.stubGlobal('window', { confirm: confirmMock })

    const result = confirmDelete(action)

    expect(result).toBe(false)
    expect(confirmMock).toHaveBeenCalledWith(MESSAGE)
    expect(action).not.toHaveBeenCalled()
  })
})
