import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

app.use(cors())
app.use(express.json())

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    supabase: SUPABASE_URL ? 'connected' : 'missing'
  })
})

app.get('/api/weekly-plans', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('weekly_plans')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weekly plans' })
  }
})

app.post('/api/weekly-plans', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('weekly_plans')
      .insert([req.body])
      .select()
    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to create weekly plan' })
  }
})

app.get('/api/sessions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' })
  }
})

app.post('/api/sessions', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert([req.body])
      .select()
    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' })
  }
})

app.get('/api/attendance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' })
  }
})

app.post('/api/attendance', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert([req.body])
      .select()
    if (error) throw error
    res.status(201).json(data[0])
  } catch (error) {
    res.status(500).json({ error: 'Failed to record attendance' })
  }
})

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(⁠ AQUASTROKE Backend running on port ${PORT} ⁠)
})

export default app
