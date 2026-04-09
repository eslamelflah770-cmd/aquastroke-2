import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Supabase Client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API Routes
app.get('/api/plans', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plans' })
  }
})

app.post('/api/plans', async (req, res) => {
  try {
    const { name, description, level, duration_weeks } = req.body

    const { data, error } = await supabase
      .from('plans')
      .insert([
        {
          name,
          description,
          level,
          duration_weeks,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to create plan' })
  }
})

app.get('/api/sessions/:planId', async (req, res) => {
  try {
    const { planId } = req.params

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('plan_id', planId)
      .order('week_number', { ascending: true })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' })
  }
})

app.post('/api/sessions', async (req, res) => {
  try {
    const { plan_id, week_number, day_of_week, title, description, distance, time_minutes } = req.body

    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          plan_id,
          week_number,
          day_of_week,
          title,
          description,
          distance,
          time_minutes,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' })
  }
})

app.get('/api/attendance/:athleteId', async (req, res) => {
  try {
    const { athleteId } = req.params

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('date', { ascending: false })

    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' })
  }
})

app.post('/api/attendance', async (req, res) => {
  try {
    const { athlete_id, session_id, date, status, notes } = req.body

    const { data, error } = await supabase
      .from('attendance')
      .insert([
        {
          athlete_id,
          session_id,
          date,
          status,
          notes,
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to record attendance' })
  }
})

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AQUASTROKE Backend running on port ${PORT}`)
})

export default app
