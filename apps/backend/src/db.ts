/**
 * AQUASTROKE Backend - Database
 * Supabase database connection and utilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger.js'

const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  logger.error('Missing Supabase credentials')
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
}

// Initialize Supabase client
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// ============================================
// DATABASE UTILITIES
// ============================================

/**
 * Execute a database query with error handling and logging
 */
export async function executeQuery<T>(
  operation: string,
  query: Promise<any>
): Promise<{ data: T[] | T | null; error: any }> {
  const startTime = Date.now()
  try {
    const result = await query
    const duration = Date.now() - startTime
    
    logger.dbOperation(operation, 'database', duration, true)
    
    return {
      data: result.data,
      error: result.error,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    logger.dbOperation(operation, 'database', duration, false)
    logger.error(`Database operation failed: ${operation}`, error)
    
    return {
      data: null,
      error,
    }
  }
}

/**
 * Check database connection
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('academies').select('id').limit(1)
    if (error) {
      logger.error('Database connection failed', error)
      return false
    }
    logger.info('Database connection successful')
    return true
  } catch (error) {
    logger.error('Database connection check failed', error)
    return false
  }
}

/**
 * Get paginated results
 */
export async function getPaginated<T>(
  table: string,
  page: number = 1,
  limit: number = 20,
  filters?: Record<string, any>
) {
  try {
    let query = supabase.from(table).select('*', { count: 'exact' })

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query.range(from, to)

    if (error) throw error

    return {
      data: data as T[],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    }
  } catch (error) {
    logger.error(`Failed to fetch paginated results from ${table}`, error)
    throw error
  }
}

/**
 * Get single record by ID
 */
export async function getById<T>(table: string, id: string) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return data as T
  } catch (error) {
    logger.error(`Failed to fetch ${table} with id ${id}`, error)
    throw error
  }
}

/**
 * Create a new record
 */
export async function create<T>(table: string, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert([data])
      .select()
      .single()

    if (error) throw error

    logger.info(`Created new record in ${table}`)
    return result as T
  } catch (error) {
    logger.error(`Failed to create record in ${table}`, error)
    throw error
  }
}

/**
 * Update a record
 */
export async function update<T>(table: string, id: string, data: any) {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    logger.info(`Updated record in ${table}`)
    return result as T
  } catch (error) {
    logger.error(`Failed to update record in ${table}`, error)
    throw error
  }
}

/**
 * Delete a record
 */
export async function deleteRecord(table: string, id: string) {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)

    if (error) throw error

    logger.info(`Deleted record from ${table}`)
    return true
  } catch (error) {
    logger.error(`Failed to delete record from ${table}`, error)
    throw error
  }
}

/**
 * Get records with filters
 */
export async function getFiltered<T>(
  table: string,
  filters: Record<string, any>,
  orderBy?: { column: string; ascending?: boolean }
) {
  try {
    let query = supabase.from(table).select('*')

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending !== false })
    }

    const { data, error } = await query

    if (error) throw error

    return data as T[]
  } catch (error) {
    logger.error(`Failed to fetch filtered results from ${table}`, error)
    throw error
  }
}

/**
 * Count records
 */
export async function count(table: string, filters?: Record<string, any>) {
  try {
    let query = supabase.from(table).select('id', { count: 'exact', head: true })

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }

    const { count: result, error } = await query

    if (error) throw error

    return result || 0
  } catch (error) {
    logger.error(`Failed to count records in ${table}`, error)
    throw error
  }
}

/**
 * Batch create records
 */
export async function batchCreate<T>(table: string, records: any[]) {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(records)
      .select()

    if (error) throw error

    logger.info(`Created ${records.length} records in ${table}`)
    return data as T[]
  } catch (error) {
    logger.error(`Failed to batch create records in ${table}`, error)
    throw error
  }
}

/**
 * Batch update records
 */
export async function batchUpdate<T>(
  table: string,
  records: Array<{ id: string; [key: string]: any }>
) {
  try {
    const results: T[] = []

    for (const record of records) {
      const { id, ...data } = record
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      results.push(result as T)
    }

    logger.info(`Updated ${records.length} records in ${table}`)
    return results
  } catch (error) {
    logger.error(`Failed to batch update records in ${table}`, error)
    throw error
  }
}

/**
 * Execute raw SQL query
 */
export async function executeRaw<T>(sql: string, params?: any[]) {
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      sql,
      params,
    })

    if (error) throw error

    return data as T[]
  } catch (error) {
    logger.error('Failed to execute raw SQL', error)
    throw error
  }
}

export default supabase
