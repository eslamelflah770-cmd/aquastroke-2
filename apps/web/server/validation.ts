import { z } from 'zod'
import type { AnyPgTable } from 'drizzle-orm/pg-core'
import * as schema from '../db/schema.js'

export const identifier = z.uuid()
export const memberRole = z.enum(['admin', 'coach', 'parent', 'athlete'])
const title = z.string().trim().min(1).max(255)
const notes = z.string().trim().max(5000).optional()
const date = z.iso.date()
const positiveInteger = z.number().int().min(1)
const numeric = z.number().finite().min(0).transform(String)
const phase = z.enum(['GPP', 'SPP1', 'SPP2', 'COMP', 'TAPER', 'CHAMP'])
const stroke = z.enum(['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'IM'])
const intensity = z.number().int().min(1).max(10)

export const academyInput = z.object({
  name: title,
  city: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(40).optional(),
  description: notes,
}).strict()

export const membershipInput = z.object({ email: z.email().toLowerCase(), role: memberRole }).strict()
export const paginationInput = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

interface Relation {
  field: string
  table: AnyPgTable
  memberRole?: 'coach' | 'parent' | 'athlete'
}

interface Resource {
  table: AnyPgTable
  create: z.ZodObject
  relations: Relation[]
  filters: string[]
  readableByAll?: boolean
  privateAthlete?: boolean
}

function resource(table: AnyPgTable, shape: z.ZodRawShape, options: Partial<Omit<Resource, 'table' | 'create'>> = {}): Resource {
  return { table, create: z.object(shape).strict(), relations: [], filters: [], ...options }
}

export const resources: Record<string, Resource> = {
  seasons: resource(schema.seasons, { name: title, start_date: date, end_date: date, is_active: z.boolean().optional(), notes }, { readableByAll: true }),
  'weekly-plans': resource(schema.weeklyPlans, {
    season_id: identifier, week_number: positiveInteger.max(36), phase,
    total_volume: z.number().int().min(0).optional(), intensity_level: intensity.optional(), focus_area: title.optional(), notes,
  }, { readableByAll: true, relations: [{ field: 'season_id', table: schema.seasons }], filters: ['season_id'] }),
  sessions: resource(schema.sessions, {
    weekly_plan_id: identifier, session_date: date, session_number: positiveInteger.max(6).optional(), title,
    description: notes, duration_minutes: positiveInteger.optional(), total_distance: positiveInteger.optional(),
    intensity_level: intensity.optional(), focus_area: title.optional(),
  }, { readableByAll: true, relations: [{ field: 'weekly_plan_id', table: schema.weeklyPlans }], filters: ['weekly_plan_id'] }),
  drills: resource(schema.drills, {
    session_id: identifier, sequence: positiveInteger, title, description: notes, distance: positiveInteger.optional(),
    duration_minutes: positiveInteger.optional(), stroke: stroke.optional(), intensity: title.optional(),
    pace_target: title.optional(), equipment: title.optional(), notes,
  }, { readableByAll: true, relations: [{ field: 'session_id', table: schema.sessions }], filters: ['session_id'] }),
  athletes: resource(schema.athletes, {
    name: title, user_id: identifier.nullable().optional(), coach_id: identifier.nullable().optional(), date_of_birth: date.optional(),
    gender: z.enum(['M', 'F']).optional(), category: z.enum(['Sprint', 'Middle', 'Distance']).optional(),
    main_stroke: stroke.optional(), css_velocity: numeric.optional(), target_t1: numeric.optional(), target_t2: numeric.optional(),
    target_t3: numeric.optional(), notes, is_active: z.boolean().optional(),
  }, { privateAthlete: true, relations: [{ field: 'coach_id', table: schema.coaches }, { field: 'user_id', table: schema.memberships, memberRole: 'athlete' }] }),
  coaches: resource(schema.coaches, { user_id: identifier, specialization: title.optional(), certification: title.optional() }, {
    relations: [{ field: 'user_id', table: schema.memberships, memberRole: 'coach' }],
  }),
  parents: resource(schema.parents, { user_id: identifier, relationship: z.enum(['father', 'mother', 'guardian']).optional() }, {
    relations: [{ field: 'user_id', table: schema.memberships, memberRole: 'parent' }],
  }),
  'parent-athlete-links': resource(schema.parentAthleteLinks, { parent_id: identifier, athlete_id: identifier }, {
    privateAthlete: true, relations: [{ field: 'parent_id', table: schema.parents }, { field: 'athlete_id', table: schema.athletes }], filters: ['parent_id', 'athlete_id'],
  }),
  attendance: resource(schema.attendance, { session_id: identifier, athlete_id: identifier, status: z.enum(['present', 'absent', 'excused', 'pending']), absence_reason: notes, notes }, {
    privateAthlete: true, relations: [{ field: 'session_id', table: schema.sessions }, { field: 'athlete_id', table: schema.athletes }], filters: ['session_id', 'athlete_id'],
  }),
  'absence-requests': resource(schema.absenceRequests, { session_id: identifier, athlete_id: identifier, parent_id: identifier, reason: title, status: z.enum(['pending', 'approved', 'rejected']).optional() }, {
    privateAthlete: true, relations: [{ field: 'session_id', table: schema.sessions }, { field: 'athlete_id', table: schema.athletes }, { field: 'parent_id', table: schema.parents }], filters: ['athlete_id', 'session_id'],
  }),
  'trial-results': resource(schema.trialResults, { athlete_id: identifier, trial_number: positiveInteger.max(3), trial_date: date, event: title, actual_time: numeric, target_time: numeric.optional(), stroke: stroke.optional(), rpe: intensity.optional(), stroke_rate: numeric.optional(), notes }, {
    privateAthlete: true, relations: [{ field: 'athlete_id', table: schema.athletes }], filters: ['athlete_id'],
  }),
  'progress-tracking': resource(schema.progressTracking, { athlete_id: identifier, tracking_date: date, metric: title, value: numeric, notes }, {
    privateAthlete: true, relations: [{ field: 'athlete_id', table: schema.athletes }], filters: ['athlete_id'],
  }),
  notifications: resource(schema.notifications, { recipient_id: identifier, title, message: z.string().trim().min(1).max(5000) }, {
    relations: [{ field: 'recipient_id', table: schema.memberships }],
  }),
  messages: resource(schema.messages, { recipient_id: identifier, content: z.string().trim().min(1).max(5000) }, {
    relations: [{ field: 'recipient_id', table: schema.memberships }],
  }),
  'audit-logs': resource(schema.auditLogs, {}),
}

export function updateInput(resourceName: string) {
  if (resourceName === 'notifications' || resourceName === 'messages') return z.object({ is_read: z.boolean() }).strict()
  return resources[resourceName].create.partial().refine((value) => Object.keys(value).length > 0, 'Provide at least one field')
}
