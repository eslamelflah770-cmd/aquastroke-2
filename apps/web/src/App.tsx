import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function App() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">🏊 AQUASTROKE</h1>
          <p className="text-gray-600">Comprehensive Swimming Training Management System</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {session ? (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome Back!</h2>
            <p className="text-gray-600 mb-6">You are logged in as: {session.user?.email}</p>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8">
            <h2 className="text-2xl font-bold mb-4">Welcome to AQUASTROKE</h2>
            <p className="text-gray-600 mb-6">
              A comprehensive platform for swimming coaches and academies to manage training programs,
              track athlete performance, and communicate with parents.
            </p>
            <button
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sign In with Google
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">🏊 Coach Dashboard</h3>
            <p className="text-gray-600">Manage training plans, athletes, and sessions</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">👨‍👩‍👧 Parent Portal</h3>
            <p className="text-gray-600">Monitor your child's progress and training</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">📊 Analytics</h3>
            <p className="text-gray-600">Track performance and improvements</p>
          </div>
        </div>
      </main>
    </div>
  )
}
