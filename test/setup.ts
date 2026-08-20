import { vi } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => {
      const emptyData = { data: [], error: null }
      const emptyPromise = Promise.resolve({ data: [], error: null })
      return {
        select: vi.fn(() => ({
          ...emptyData,
          order: vi.fn(() => emptyPromise),
        })),
        insert: vi.fn(() => ({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ data: null, error: null })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({ data: null, error: null })),
        })),
        eq: vi.fn(() => ({ data: [], error: null })),
        order: vi.fn(() => emptyPromise),
        upsert: vi.fn(() => Promise.resolve({ error: null })),
      }
    }),
  })),
}))
