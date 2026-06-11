import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthProvider'

type League = { id: number; name: string; invite_code: string }

export default function LeaguesPage() {
  const { user, signOut } = useAuth()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('leagues')
      .select('id, name, invite_code')
      .order('created_at', { ascending: true })
    if (error) setErr(error.message)
    else setLeagues(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const createLeague = async () => {
    setErr(null); setMsg(null)
    if (!name.trim()) return
    const { data, error } = await supabase.rpc('create_league', { p_name: name.trim() })
    if (error) { setErr(error.message); return }
    const created = Array.isArray(data) ? data[0] : data
    setMsg(`Created "${name.trim()}" — invite code: ${created.invite_code}`)
    setName('')
    load()
  }

  const joinLeague = async () => {
    setErr(null); setMsg(null)
    if (!code.trim()) return
    const { error } = await supabase.rpc('join_league', { p_code: code.trim() })
    if (error) { setErr(error.message); return }
    setMsg('Joined league!')
    setCode('')
    load()
  }

  const username = (user?.user_metadata as { username?: string })?.username ?? 'player'

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <h1 className="text-xl font-bold">⚽ World Cup Predictions</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-300">{username}</span>
          <button onClick={signOut} className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500">
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-3">Your Leagues</h2>
          {loading ? (
            <p className="text-slate-400">Loading…</p>
          ) : leagues.length === 0 ? (
            <p className="text-slate-400">You're not in any leagues yet. Create or join one below.</p>
          ) : (
            <ul className="space-y-2">
              {leagues.map(l => (
                <li key={l.id} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                  <span className="font-medium">{l.name}</span>
                  <span className="text-sm text-slate-400">
                    code: <span className="font-mono text-emerald-400">{l.invite_code}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {msg && <p className="text-emerald-400 text-sm">{msg}</p>}
        {err && <p className="text-red-400 text-sm">{err}</p>}

        <section className="grid sm:grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold">Create a league</h3>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="League name"
              className="w-full px-3 py-2 rounded-lg bg-slate-700 outline-none" />
            <button onClick={createLeague}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold">
              Create
            </button>
          </div>

          <div className="bg-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold">Join a league</h3>
            <input value={code} onChange={e => setCode(e.target.value)}
              placeholder="Invite code"
              className="w-full px-3 py-2 rounded-lg bg-slate-700 outline-none font-mono uppercase" />
            <button onClick={joinLeague}
              className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-semibold">
              Join
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}