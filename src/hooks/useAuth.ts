import { useEffect, useState, useCallback } from 'react'
import type { Session, User, AuthError, PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { mapAuthError } from '../lib/authErrors'

interface OtpError {
  message: string
  code?: string
}

export interface AuthState {
  session: Session | null
  user: User | null
  isVerified: boolean
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  deleteAccount: () => Promise<{ error: AuthError | PostgrestError | null }>
  resendVerification: () => Promise<{ error: OtpError | null }>
  sendOtp: () => Promise<{ error: OtpError | null }>
  verifyOtp: (code: string) => Promise<{ error: OtpError | null }>
  refreshVerification: () => Promise<void>
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkVerification = useCallback(async (s: Session | null) => {
    if (!s?.access_token || !s.user?.email) {
      setIsVerified(false)
      return
    }

    try {
      const response = await fetch('/api/verification-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s.access_token}`,
        },
        body: JSON.stringify({ email: s.user.email }),
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = (await response.json()) as { verified?: boolean }
      setIsVerified(data.verified === true)
    } catch (err) {
      // Never fail auth loading because the verification check failed.
      console.error('Verification check failed', err)
      setIsVerified(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Supabase не настроен: добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env.local')
      setLoading(false)
      return
    }

    supabase.auth
      .getSession()
      .then(async ({ data, error: sessionError }) => {
        if (!mounted) return
        if (sessionError) {
          setError(mapAuthError(sessionError))
        } else {
          const currentSession = data.session
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          await checkVerification(currentSession)
        }
        if (mounted) setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setUser(newSession?.user ?? null)
      if (newSession?.user) {
        await checkVerification(newSession)
      } else {
        setIsVerified(false)
      }
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [checkVerification])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(mapAuthError(signInError))
    } else {
      setError(null)
    }
    return { error: signInError }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(mapAuthError(signUpError))
    } else {
      setError(null)
    }
    return { error: signUpError }
  }, [])

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(mapAuthError(signOutError))
    }
    return { error: signOutError }
  }, [])

  const updatePassword = useCallback(async (password: string) => {
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(mapAuthError(updateError))
    } else {
      setError(null)
    }
    return { error: updateError }
  }, [])

  const deleteAccount = useCallback(async () => {
    const { error: rpcError } = await supabase.rpc('delete_user')
    if (rpcError) {
      setError(mapAuthError(rpcError))
      return { error: rpcError }
    }

    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(mapAuthError(signOutError))
      return { error: signOutError }
    }

    return { error: null }
  }, [])

  const sendOtp = useCallback(async () => {
    if (!session?.access_token || !user?.email) {
      return { error: { message: 'Пользователь не авторизован' } }
    }

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: user.email }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        return { error: { message: data.error || 'Не удалось отправить код' } }
      }

      return { error: null }
    } catch (err) {
      return { error: { message: err instanceof Error ? err.message : 'Не удалось отправить код' } }
    }
  }, [session, user])

  const verifyOtp = useCallback(
    async (code: string) => {
      if (!session?.access_token || !user?.email) {
        return { error: { message: 'Пользователь не авторизован' } }
      }

      try {
        const response = await fetch('/api/verify-otp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email: user.email, code }),
        })

        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string }
          return { error: { message: data.error || 'Не удалось проверить код' } }
        }

        return { error: null }
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : 'Не удалось проверить код' } }
      }
    },
    [session, user],
  )

  const refreshVerification = useCallback(async () => {
    await checkVerification(session)
  }, [session, checkVerification])

  const resendVerification = sendOtp

  return {
    session,
    user,
    isVerified,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updatePassword,
    deleteAccount,
    resendVerification,
    sendOtp,
    verifyOtp,
    refreshVerification,
  }
}
