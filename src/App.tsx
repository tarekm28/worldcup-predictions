import { useState } from 'react'
import { useAuth } from './auth/AuthProvider'
import AuthPage from './pages/AuthPages'
import ThePool from './pool/ThePool'
import Landing from './pages/Landing'

function App() {
  const { user, loading } = useAuth()
  const [entering, setEntering] = useState(false)

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-slate-900 text-white">Loading…</div>
  }

  if (!user) {
    return entering ? <AuthPage /> : <Landing onEnter={() => setEntering(true)} />
  }

  return <ThePool />
}

export default App