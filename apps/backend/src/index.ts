/**
 * AQUASTROKE Backend - Main Server
 * Express server with comprehensive API routes and middleware
 */

import express, { Request, Response } from 'express'
import dotenv from 'dotenv'
import { supabase, checkConnection, getFiltered, getPaginated, create, update, deleteRecord, getById } from './db.js'
import {
  authMiddleware,
  requireRole,
  validateRequest,
  validateQuery,
  requestLogger,
  errorHandler,
  notFoundHandler,
  corsMiddleware,
  rateLimitMiddleware,
  successResponse,
  errorResponse,
} from './middleware.js'
import {
  CreateWeeklyPlanSchema,
  UpdateWeeklyPlanSchema,
  CreateSessionSchema,
  UpdateSessionSchema,
  CreateDrillSchema,
  UpdateDrillSchema,
  CreateAttendanceSchema,
  UpdateAttendanceSchema,
  CreateAthleteSchema,
  UpdateAthleteSchema,
  CreateTrialResultSchema,
  UpdateTrialResultSchema,
  PaginationSchema,
  FilterSchema,
} from './validation.js'
import { logger } from './logger.js'
import { AuthRequest, ApiResponse } from './types.js'

// Load environment variables
dotenv.config({ path: '.env.local' })
dotenv.config()

// Initialize Express app
const app = express()
const PORT = parseInt((process.env.PORT || '3001'), 10)
const NODE_ENV = process.env.NODE_ENV || 'development'

// ============================================
// MIDDLEWARE SETUP
// ============================================

// CORS and basic middleware
app.use(corsMiddleware)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Request logging
app.use(requestLogger)

// Rate limiting
app.use(rateLimitMiddleware(100, 60000))

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const isConnected = await checkConnection()
    res.json(successResponse({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      database: isConnected ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    }))
  } catch (error) {
    logger.error('Health check failed', error)
    res.status(500).json(errorResponse('Health check failed', 'HEALTH_CHECK_ERROR'))
  }
})

// ============================================
// WEEKLY PLANS ROUTES
// ============================================

// Get all weekly plans with pagination
app.get('/api/weekly-plans', authMiddleware, validateQuery(PaginationSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query as any
    const filters = { academy_id: req.user?.academy_id }

    const result = await getPaginated('weekly_plans', page, limit, filters)
    res.json(successResponse(result))
  } catch (error) {
    logger.error('Failed to fetch weekly plans', error)
    res.status(500).json(errorResponse('Failed to fetch weekly plans', 'FETCH_ERROR'))
  }
})

// Get single weekly plan
app.get('/api/weekly-plans/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const plan = await getById('weekly_plans', req.params.id)
    res.json(successResponse(plan))
  } catch (error) {
    logger.error('Failed to fetch weekly plan', error)
    res.status(404).json(errorResponse('Weekly plan not found', 'NOT_FOUND'))
  }
})

// Create weekly plan
app.post('/api/weekly-plans', authMiddleware, requireRole('coach', 'admin'), validateRequest(CreateWeeklyPlanSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data = {
      ...req.body,
      academy_id: req.user?.academy_id,
    }
    const plan = await create('weekly_plans', data)
    res.status(201).json(successResponse(plan, 'Weekly plan created successfully'))
  } catch (error) {
    logger.error('Failed to create weekly plan', error)
    res.status(500).json(errorResponse('Failed to create weekly plan', 'CREATE_ERROR'))
  }
})

// Update weekly plan
app.put('/api/weekly-plans/:id', authMiddleware, requireRole('coach', 'admin'), validateRequest(UpdateWeeklyPlanSchema), async (req: AuthRequest, res: Response) => {
  try {
    const plan = await update('weekly_plans', req.params.id, req.body)
    res.json(successResponse(plan, 'Weekly plan updated successfully'))
  } catch (error) {
    logger.error('Failed to update weekly plan', error)
    res.status(500).json(errorResponse('Failed to update weekly plan', 'UPDATE_ERROR'))
  }
})

// Delete weekly plan
app.delete('/api/weekly-plans/:id', authMiddleware, requireRole('coach', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    await deleteRecord('weekly_plans', req.params.id)
    res.json(successResponse({ id: req.params.id }, 'Weekly plan deleted successfully'))
  } catch (error) {
    logger.error('Failed to delete weekly plan', error)
    res.status(500).json(errorResponse('Failed to delete weekly plan', 'DELETE_ERROR'))
  }
})

// ============================================
// SESSIONS ROUTES
// ============================================

// Get all sessions
app.get('/api/sessions', authMiddleware, validateQuery(PaginationSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query as any
    const filters = { academy_id: req.user?.academy_id }

    const result = await getPaginated('sessions', page, limit, filters)
    res.json(successResponse(result))
  } catch (error) {
    logger.error('Failed to fetch sessions', error)
    res.status(500).json(errorResponse('Failed to fetch sessions', 'FETCH_ERROR'))
  }
})

// Get single session
app.get('/api/sessions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const session = await getById('sessions', req.params.id)
    res.json(successResponse(session))
  } catch (error) {
    logger.error('Failed to fetch session', error)
    res.status(404).json(errorResponse('Session not found', 'NOT_FOUND'))
  }
})

// Create session
app.post('/api/sessions', authMiddleware, requireRole('coach', 'admin'), validateRequest(CreateSessionSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data = {
      ...req.body,
      academy_id: req.user?.academy_id,
    }
    const session = await create('sessions', data)
    res.status(201).json(successResponse(session, 'Session created successfully'))
  } catch (error) {
    logger.error('Failed to create session', error)
    res.status(500).json(errorResponse('Failed to create session', 'CREATE_ERROR'))
  }
})

// Update session
app.put('/api/sessions/:id', authMiddleware, requireRole('coach', 'admin'), validateRequest(UpdateSessionSchema), async (req: AuthRequest, res: Response) => {
  try {
    const session = await update('sessions', req.params.id, req.body)
    res.json(successResponse(session, 'Session updated successfully'))
  } catch (error) {
    logger.error('Failed to update session', error)
    res.status(500).json(errorResponse('Failed to update session', 'UPDATE_ERROR'))
  }
})

// Delete session
app.delete('/api/sessions/:id', authMiddleware, requireRole('coach', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    await deleteRecord('sessions', req.params.id)
    res.json(successResponse({ id: req.params.id }, 'Session deleted successfully'))
  } catch (error) {
    logger.error('Failed to delete session', error)
    res.status(500).json(errorResponse('Failed to delete session', 'DELETE_ERROR'))
  }
})

// ============================================
// DRILLS ROUTES
// ============================================

// Get all drills for a session
app.get('/api/sessions/:sessionId/drills', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const drills = await getFiltered('drills', { session_id: req.params.sessionId }, { column: 'sequence' })
    res.json(successResponse(drills))
  } catch (error) {
    logger.error('Failed to fetch drills', error)
    res.status(500).json(errorResponse('Failed to fetch drills', 'FETCH_ERROR'))
  }
})

// Create drill
app.post('/api/drills', authMiddleware, requireRole('coach', 'admin'), validateRequest(CreateDrillSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data = {
      ...req.body,
      academy_id: req.user?.academy_id,
    }
    const drill = await create('drills', data)
    res.status(201).json(successResponse(drill, 'Drill created successfully'))
  } catch (error) {
    logger.error('Failed to create drill', error)
    res.status(500).json(errorResponse('Failed to create drill', 'CREATE_ERROR'))
  }
})

// Update drill
app.put('/api/drills/:id', authMiddleware, requireRole('coach', 'admin'), validateRequest(UpdateDrillSchema), async (req: AuthRequest, res: Response) => {
  try {
    const drill = await update('drills', req.params.id, req.body)
    res.json(successResponse(drill, 'Drill updated successfully'))
  } catch (error) {
    logger.error('Failed to update drill', error)
    res.status(500).json(errorResponse('Failed to update drill', 'UPDATE_ERROR'))
  }
})

// Delete drill
app.delete('/api/drills/:id', authMiddleware, requireRole('coach', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    await deleteRecord('drills', req.params.id)
    res.json(successResponse({ id: req.params.id }, 'Drill deleted successfully'))
  } catch (error) {
    logger.error('Failed to delete drill', error)
    res.status(500).json(errorResponse('Failed to delete drill', 'DELETE_ERROR'))
  }
})

// ============================================
// ATTENDANCE ROUTES
// ============================================

// Get attendance for a session
app.get('/api/sessions/:sessionId/attendance', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const attendance = await getFiltered('attendance', { session_id: req.params.sessionId })
    res.json(successResponse(attendance))
  } catch (error) {
    logger.error('Failed to fetch attendance', error)
    res.status(500).json(errorResponse('Failed to fetch attendance', 'FETCH_ERROR'))
  }
})

// Record attendance
app.post('/api/attendance', authMiddleware, requireRole('coach', 'admin'), validateRequest(CreateAttendanceSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data = {
      ...req.body,
      academy_id: req.user?.academy_id,
      marked_by: req.user?.id,
      marked_at: new Date().toISOString(),
    }
    const attendance = await create('attendance', data)
    res.status(201).json(successResponse(attendance, 'Attendance recorded successfully'))
  } catch (error) {
    logger.error('Failed to record attendance', error)
    res.status(500).json(errorResponse('Failed to record attendance', 'CREATE_ERROR'))
  }
})

// Update attendance
app.put('/api/attendance/:id', authMiddleware, requireRole('coach', 'admin'), validateRequest(UpdateAttendanceSchema), async (req: AuthRequest, res: Response) => {
  try {
    const attendance = await update('attendance', req.params.id, req.body)
    res.json(successResponse(attendance, 'Attendance updated successfully'))
  } catch (error) {
    logger.error('Failed to update attendance', error)
    res.status(500).json(errorResponse('Failed to update attendance', 'UPDATE_ERROR'))
  }
})

// ============================================
// ATHLETES ROUTES
// ============================================

// Get all athletes
app.get('/api/athletes', authMiddleware, validateQuery(PaginationSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query as any
    const filters = { academy_id: req.user?.academy_id, is_active: true }

    const result = await getPaginated('athletes', page, limit, filters)
    res.json(successResponse(result))
  } catch (error) {
    logger.error('Failed to fetch athletes', error)
    res.status(500).json(errorResponse('Failed to fetch athletes', 'FETCH_ERROR'))
  }
})

// Get single athlete
app.get('/api/athletes/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const athlete = await getById('athletes', req.params.id)
    res.json(successResponse(athlete))
  } catch (error) {
    logger.error('Failed to fetch athlete', error)
    res.status(404).json(errorResponse('Athlete not found', 'NOT_FOUND'))
  }
})

// Create athlete
app.post('/api/athletes', authMiddleware, requireRole('coach', 'admin'), validateRequest(CreateAthleteSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data = {
      ...req.body,
      academy_id: req.user?.academy_id,
      is_active: true,
    }
    const athlete = await create('athletes', data)
    res.status(201).json(successResponse(athlete, 'Athlete created successfully'))
  } catch (error) {
    logger.error('Failed to create athlete', error)
    res.status(500).json(errorResponse('Failed to create athlete', 'CREATE_ERROR'))
  }
})

// Update athlete
app.put('/api/athletes/:id', authMiddleware, requireRole('coach', 'admin'), validateRequest(UpdateAthleteSchema), async (req: AuthRequest, res: Response) => {
  try {
    const athlete = await update('athletes', req.params.id, req.body)
    res.json(successResponse(athlete, 'Athlete updated successfully'))
  } catch (error) {
    logger.error('Failed to update athlete', error)
    res.status(500).json(errorResponse('Failed to update athlete', 'UPDATE_ERROR'))
  }
})

// ============================================
// TRIAL RESULTS ROUTES
// ============================================

// Get trial results for athlete
app.get('/api/athletes/:athleteId/trial-results', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const results = await getFiltered('trial_results', { athlete_id: req.params.athleteId }, { column: 'trial_date', ascending: false })
    res.json(successResponse(results))
  } catch (error) {
    logger.error('Failed to fetch trial results', error)
    res.status(500).json(errorResponse('Failed to fetch trial results', 'FETCH_ERROR'))
  }
})

// Create trial result
app.post('/api/trial-results', authMiddleware, requireRole('coach', 'admin'), validateRequest(CreateTrialResultSchema), async (req: AuthRequest, res: Response) => {
  try {
    const data = {
      ...req.body,
      academy_id: req.user?.academy_id,
      recorded_by: req.user?.id,
    }
    const result = await create('trial_results', data)
    res.status(201).json(successResponse(result, 'Trial result created successfully'))
  } catch (error) {
    logger.error('Failed to create trial result', error)
    res.status(500).json(errorResponse('Failed to create trial result', 'CREATE_ERROR'))
  }
})

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFoundHandler)

// Error handler (must be last)
app.use(errorHandler)

// ============================================
// SERVER STARTUP
// ============================================

async function startServer() {
  try {
    // Check database connection
    const isConnected = await checkConnection()
    if (!isConnected) {
      throw new Error('Failed to connect to database')
    }

    // Start listening
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`AQUASTROKE Backend running on port ${PORT}`)
      logger.info(`Environment: ${NODE_ENV}`)
      logger.info(`Health check: http://localhost:${PORT}/api/health`)
    })
  } catch (error) {
    logger.error('Failed to start server', error)
    process.exit(1)
  }
}

startServer()

export default app
