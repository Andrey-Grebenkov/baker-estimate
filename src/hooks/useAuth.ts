import { useEffect, useRef, useState, useCallback } from 'react'
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
  isInitialLoading: boolean
  isVerificationLoading: boolean
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
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [isVerificationLoading, setIsVerificationLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sessionRef = useRef<Session | null>(null)
  const userRef = useRef<User | null>(null)

  const checkVerification = useCallback(
    async (s: Session | null, options?: { silent?: boolean }) => {
      const { silent = false } = options ?? {}

      setIsVerificationLoading(true)

      // Default-deny on first load; keep the current value for background
      // re-checks so an open OTP modal is not unmounted while refetching.
      if (!silent) {
        setIsVerified(false)
      }

      if (!s?.access_token || !s.user?.email) {
        if (!silent) setIsVerified(false)
        setIsVerificationLoading(false)
        if (!silent) setIsInitialLoading(false)
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
        // Don't flip a verified user to unverified because of a transient
        // background network error. Only fail closed on the initial load.
        console.error('Verification check failed', err)
        if (!silent) setIsVerified(false)
      } finally {
        setIsVerificationLoading(false)
        if (!silent) setIsInitialLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    let mounted = true

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Supabase не настроен: добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env.local')
      setIsInitialLoading(false)
      return
    }

    const updateSessionAndUser = (newSession: Session | null) => {
      if (newSession?.access_token !== sessionRef.current?.access_token) {
        setSession(newSession)
        sessionRef.current = newSession
      }

      const newUser = newSession?.user ?? null
      if (newUser?.id !== userRef.current?.id) {
        setUser(newUser)
        userRef.current = newUser
      }
    }

    supabase.auth
      .getSession()
      .then(async ({ data, error: sessionError }) => {
        if (!mounted) return
        if (sessionError) {
          setError(mapAuthError(sessionError))
          setIsInitialLoading(false)
        } else {
          const currentSession = data.session
          updateSessionAndUser(currentSession)
          await checkVerification(currentSession, { silent: false })
        }
      })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return

      // getSession handles the initial mount; avoid a duplicate verification
      // check and the race conditions it creates.
      if (event === 'INITIAL_SESSION') {
        return
      }

      // Only a real sign-out should null the session. Token refreshes and
      // user-updated events must not transiently unmount the app tree.
      if (event === 'SIGNED_OUT') {
        setSession(null)
        sessionRef.current = null
        setUser(null)
        userRef.current = null
        setIsVerified(false)
        setIsVerificationLoading(false)
        return
      }

      // Ignore SIGNED_IN / TOKEN_REFRESHED events that carry no session.
      if (!newSession?.user) {
        return
      }

      // Update the session token (e.g. after a refresh) without replacing the
      // user object when the id is the same, so the app tree does not re-render
      // and form state is preserved.
      if (newSession.user.id === userRef.current?.id) {
        if (newSession.access_token !== sessionRef.current?.access_token) {
          setSession(newSession)
          sessionRef.current = newSession
        }
        await checkVerification(newSession, { silent: true })
        return
      }

      updateSessionAndUser(newSession)
      await checkVerification(newSession, { silent: true })
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

        // The backend has already inserted the verified_emails row.
        // We can treat a 2xx response as a successful verification.
        setIsVerified(true)
        return { error: null }
      } catch (err) {
        return { error: { message: err instanceof Error ? err.message : 'Не удалось проверить код' } }
      }
    },
    [session, user],
  )

  const refreshVerification = useCallback(async () => {
    await checkVerification(session, { silent: true })
  }, [session, checkVerification])

  const resendVerification = sendOtp

  return {
    session,
    user,
    isVerified,
    isInitialLoading,
    isVerificationLoading,
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
