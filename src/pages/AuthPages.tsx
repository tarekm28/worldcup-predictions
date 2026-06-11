import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthProvider'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'register') await signUp(username, password)
      else await signIn(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-slate-800 rounded-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">⚽ World Cup Predictions</h1>

        <div className="flex rounded-lg overflow-hidden border border-slate-600">
          <button type="button" onClick={() => setMode('login')}
            className={`flex-1 py-2 ${mode === 'login' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
            Login
          </button>
          <button type="button" onClick={() => setMode('register')}
            className={`flex-1 py-2 ${mode === 'register' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
            Register
          </button>
        </div>

        <input value={username} onChange={e => setUsername(e.target.value)}
          placeholder="Username" autoComplete="username" required
          className="w-full px-3 py-2 rounded-lg bg-slate-700 outline-none" />

        <input value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Password" type="password" required minLength={6}
          autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          className="w-full px-3 py-2 rounded-lg bg-slate-700 outline-none" />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={busy}
          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-semibold">
          {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}