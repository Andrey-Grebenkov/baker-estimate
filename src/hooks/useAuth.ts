import { useEffect, useState, useCallback } from 'react'
import type { Session, User, AuthError, PostgrestError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { mapAuthError } from '../lib/authErrors'

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
  resendVerification: () => Promise<{ error: AuthError | null }>
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setError('Supabase не настроен: добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env.local')
      setLoading(false)
      return
    }

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) return
        if (sessionError) {
          setError(mapAuthError(sessionError))
        } else {
          setSession(data.session)
          setUser(data.session?.user ?? null)
        }
        setLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

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

  const resendVerification = useCallback(async () => {
    if (!user?.email) {
      return { error: { message: 'Пользователь не авторизован', code: undefined } as AuthError }
    }
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : ''
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      ...(redirectTo ? { options: { emailRedirectTo: redirectTo } } : {}),
    })
    return { error }
  }, [user])

  const isVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at)

  return { session, user, isVerified, loading, error, signIn, signUp, signOut, updatePassword, deleteAccount, resendVerification }
}
