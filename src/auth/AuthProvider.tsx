import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextType = {
  user: User | null
  loading: boolean
  signUp: (username: string, password: string) => Promise<void>
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Supabase needs an email. Allow a full email or derive a fake one from a username.
const emailFor = (value: string) => {
  const trimmed = value.trim().toLowerCase()
  if (trimmed.includes('@')) return trimmed
  const local = trimmed.replace(/\s+/g, '.').replace(/[^a-z0-9._-]/g, '')
  return `${local}@worldcup.local`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const signUp = async (username: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email: emailFor(username),
      password,
      options: { data: { username: username.trim() } },
    })
    if (error) throw error
  }

  const signIn = async (username: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: emailFor(username),
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, loading, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}