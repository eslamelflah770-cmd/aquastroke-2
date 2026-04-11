import { useState, useEffect } from 'react'
import { createClient, Session } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)
const API_URL = 'https://aquastroke-backend.vercel.app'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [weeklyPlans, setWeeklyPlans] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session) {
      fetch(`${API_URL}/api/weekly-plans`)
        .then(res => res.json())
        .then(data => setWeeklyPlans(data))
        .catch(err => console.error(err))
    }
  }, [session])

  const handleLogin = async () => {
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
  }

  const handleSignUp = async () => {
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else setError('Check your email to confirm!')
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-xl">Loading...</div></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">AQUASTROKE</h1>
          <p className="text-gray-600">Swimming Training Management</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-12">
        {session ? (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome!</h2>
            <p className="text-gray-600 mb-4">{session?.user?.email}</p>
            <h3 className="text-lg font-semibold mb-2">Weekly Plans: {weeklyPlans.length}</h3>
            <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 bg-red-500 text-white rounded">Sign Out</button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-6">Sign In</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-3 py-2 mb-3" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-3 py-2 mb-4" />
            <button onClick={handleLogin} className="w-full px-4 py-2 bg-blue-500 text-white rounded mb-2">Sign In</button>
            <button onClick={handleSignUp} className="w-full px-4 py-2 bg-green-500 text-white rounded">Sign Up</button>
          </div>
        )}
      </main>
    </div>
  )
}
