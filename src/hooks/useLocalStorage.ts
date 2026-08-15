import { useCallback, useEffect, useState } from 'react'

type SetValue<T> = (value: T | ((prev: T) => T)) => void

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [stored, setStored] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        return JSON.parse(item) as T
      }
    } catch {
      // ignore parse errors and return initial value
    }

    return initialValue
  })

  const setValue: SetValue<T> = useCallback(
    (value) => {
      setStored((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value

        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
          // ignore storage errors
        }

        return next
      })
    },
    [key],
  )

  // re-sync if the key changes (e.g. user clears storage in another tab)
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStored(JSON.parse(item) as T)
      }
    } catch {
      // ignore
    }
  }, [key])

  return [stored, setValue]
}
