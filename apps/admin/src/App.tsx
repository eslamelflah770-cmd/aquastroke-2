import { useState, useEffect } from 'react'
import { createClient, Session } from '@supabase/supabase-js'
import { BarChart3, Users, Calendar, TrendingUp } from 'lucide-react'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function App() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [stats, setStats] = useState({
    athletes: 0,
    coaches: 0,
    sessions: 0,
    academies: 0
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        fetchStats()
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch stats from database
      const { count: athletesCount } = await supabase
        .from('athletes')
        .select('*', { count: 'exact', head: true })

      const { count: coachesCount } = await supabase
        .from('coaches')
        .select('*', { count: 'exact', head: true })

      const { count: sessionsCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })

      const { count: academiesCount } = await supabase
        .from('academies')
        .select('*', { count: 'exact', head: true })

      setStats({
        athletes: athletesCount || 0,
        coaches: coachesCount || 0,
        sessions: sessionsCount || 0,
        academies: academiesCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-2">🏊 AQUASTROKE</h1>
          <p className="text-gray-600 mb-6">Admin Dashboard</p>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🏊 AQUASTROKE Admin</h1>
            <p className="text-gray-600">Management Dashboard</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Athletes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.athletes}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Coaches</p>
                <p className="text-3xl font-bold text-gray-900">{stats.coaches}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Sessions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.sessions}</p>
              </div>
              <Calendar className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Academies</p>
                <p className="text-3xl font-bold text-gray-900">{stats.academies}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">👥 User Management</h2>
            <p className="text-gray-600 mb-4">Manage coaches, parents, and athletes</p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Go to Users
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">🏢 Academy Management</h2>
            <p className="text-gray-600 mb-4">Manage academies and organizations</p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Go to Academies
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">📊 Reports</h2>
            <p className="text-gray-600 mb-4">View analytics and performance reports</p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              View Reports
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">⚙️ Settings</h2>
            <p className="text-gray-600 mb-4">System configuration and preferences</p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Go to Settings
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
