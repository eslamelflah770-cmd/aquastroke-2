/**
 * AQUASTROKE Backend - Middleware
 * Authentication, validation, error handling, and logging middleware
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { ZodSchema } from 'zod'
import { AuthRequest, AuthUser, ApiResponse, ErrorResponse } from './types'
import { logger } from './logger'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid authorization header')
      return res.status(401).json({
        success: false,
        error: 'Missing authorization token',
        code: 'MISSING_TOKEN',
        timestamp: new Date().toISOString(),
      } as ErrorResponse)
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser

    req.user = decoded
    logger.debug(`User authenticated: ${decoded.id}`)
    next()
  } catch (error) {
    logger.error('Authentication failed:', error)
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString(),
    } as ErrorResponse)
  }
}

// ============================================
// AUTHORIZATION MIDDLEWARE
// ============================================

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'NOT_AUTHENTICATED',
        timestamp: new Date().toISOString(),
      } as ErrorResponse)
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`User ${req.user.id} attempted unauthorized action with role ${req.user.role}`)
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        timestamp: new Date().toISOString(),
      } as ErrorResponse)
    }

    next()
  }
}

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body)
      req.body = validated
      next()
    } catch (error: any) {
      logger.warn('Validation error:', error.errors)
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        details: error.errors,
      })
    }
  }
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query)
      req.query = validated as any
      next()
    } catch (error: any) {
      logger.warn('Query validation error:', error.errors)
      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
        details: error.errors,
      })
    }
  }
}

// ============================================
// LOGGING MIDDLEWARE
// ============================================

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now()
  const userId = (req as AuthRequest).user?.id || 'anonymous'

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const level = res.statusCode >= 400 ? 'warn' : 'info'
    
    logger.log(level, `${req.method} ${req.path} - ${res.statusCode} (${duration}ms) - User: ${userId}`)
  })

  next()
}

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Unhandled error:', err)

  // Supabase errors
  if (err.message?.includes('duplicate key')) {
    return res.status(409).json({
      success: false,
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE',
      timestamp: new Date().toISOString(),
      path: req.path,
    } as ErrorResponse)
  }

  if (err.message?.includes('not found') || err.code === 'PGRST116') {
    return res.status(404).json({
      success: false,
      error: 'Resource not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
      path: req.path,
    } as ErrorResponse)
  }

  // Foreign key constraint errors
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      error: 'Invalid reference to related resource',
      code: 'INVALID_REFERENCE',
      timestamp: new Date().toISOString(),
      path: req.path,
    } as ErrorResponse)
  }

  // Unique constraint errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate value for unique field',
      code: 'DUPLICATE_VALUE',
      timestamp: new Date().toISOString(),
      path: req.path,
    } as ErrorResponse)
  }

  // Default error response
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    path: req.path,
  } as ErrorResponse)
}

// ============================================
// NOT FOUND MIDDLEWARE
// ============================================

export function notFoundHandler(req: Request, res: Response) {
  logger.warn(`Route not found: ${req.method} ${req.path}`)
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    path: req.path,
  } as ErrorResponse)
}

// ============================================
// CORS MIDDLEWARE
// ============================================

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
  ].filter(Boolean)

  const origin = req.headers.origin
  if (allowedOrigins.includes(origin as string)) {
    res.setHeader('Access-Control-Allow-Origin', origin as string)
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }

  next()
}

// ============================================
// RATE LIMITING MIDDLEWARE (Basic)
// ============================================

const requestCounts = new Map<string, { count: number; resetTime: number }>()

export function rateLimitMiddleware(maxRequests = 100, windowMs = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req as AuthRequest).user?.id || req.ip || 'unknown'
    const now = Date.now()
    const record = requestCounts.get(key)

    if (!record || now > record.resetTime) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs })
      return next()
    }

    record.count++

    if (record.count > maxRequests) {
      logger.warn(`Rate limit exceeded for ${key}`)
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        timestamp: new Date().toISOString(),
      })
    }

    next()
  }
}

// ============================================
// RESPONSE WRAPPER MIDDLEWARE
// ============================================

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  }
}

export function errorResponse(error: string, code?: string): ErrorResponse {
  return {
    success: false,
    error,
    code: code || 'ERROR',
    timestamp: new Date().toISOString(),
  }
}
