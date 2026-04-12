/**
 * AQUASTROKE Backend - Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod'

// ============================================
// COMMON SCHEMAS
// ============================================

const UUIDSchema = z.string().uuid()
const DateSchema = z.string().datetime().or(z.string().date())
const PhaseEnum = z.enum(['GPP', 'SPP1', 'SPP2', 'COMP', 'TAPER', 'CHAMP'])
const StrokeEnum = z.enum(['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'IM'])
const AttendanceStatusEnum = z.enum(['present', 'absent', 'excused', 'pending'])
const CategoryEnum = z.enum(['Sprint', 'Middle', 'Distance'])
const GenderEnum = z.enum(['M', 'F'])

// ============================================
// WEEKLY PLAN SCHEMAS
// ============================================

export const CreateWeeklyPlanSchema = z.object({
  season_id: UUIDSchema,
  week_number: z.number().int().min(1).max(36),
  phase: PhaseEnum,
  total_volume: z.number().optional(),
  intensity_level: z.number().int().min(1).max(10).optional(),
  focus_area: z.string().max(255).optional(),
  notes: z.string().optional(),
})

export const UpdateWeeklyPlanSchema = z.object({
  week_number: z.number().int().min(1).max(36).optional(),
  phase: PhaseEnum.optional(),
  total_volume: z.number().optional(),
  intensity_level: z.number().int().min(1).max(10).optional(),
  focus_area: z.string().max(255).optional(),
  notes: z.string().optional(),
})

// ============================================
// SESSION SCHEMAS
// ============================================

export const CreateSessionSchema = z.object({
  weekly_plan_id: UUIDSchema,
  session_date: DateSchema,
  session_number: z.number().int().min(1).max(6).optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  duration_minutes: z.number().int().min(1).optional(),
  total_distance: z.number().int().min(1).optional(),
  intensity_level: z.number().int().min(1).max(10).optional(),
  focus_area: z.string().max(255).optional(),
})

export const UpdateSessionSchema = z.object({
  session_date: DateSchema.optional(),
  session_number: z.number().int().min(1).max(6).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  duration_minutes: z.number().int().min(1).optional(),
  total_distance: z.number().int().min(1).optional(),
  intensity_level: z.number().int().min(1).max(10).optional(),
  focus_area: z.string().max(255).optional(),
})

// ============================================
// DRILL SCHEMAS
// ============================================

export const CreateDrillSchema = z.object({
  session_id: UUIDSchema,
  sequence: z.number().int().min(1),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  distance: z.number().int().min(1).optional(),
  duration_minutes: z.number().int().min(1).optional(),
  stroke: StrokeEnum.optional(),
  intensity: z.string().max(50).optional(),
  pace_target: z.string().max(50).optional(),
  equipment: z.string().max(255).optional(),
  notes: z.string().optional(),
})

export const UpdateDrillSchema = z.object({
  sequence: z.number().int().min(1).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  distance: z.number().int().min(1).optional(),
  duration_minutes: z.number().int().min(1).optional(),
  stroke: StrokeEnum.optional(),
  intensity: z.string().max(50).optional(),
  pace_target: z.string().max(50).optional(),
  equipment: z.string().max(255).optional(),
  notes: z.string().optional(),
})

// ============================================
// ATTENDANCE SCHEMAS
// ============================================

export const CreateAttendanceSchema = z.object({
  session_id: UUIDSchema,
  athlete_id: UUIDSchema,
  status: AttendanceStatusEnum,
  absence_reason: z.string().optional(),
  notes: z.string().optional(),
})

export const UpdateAttendanceSchema = z.object({
  status: AttendanceStatusEnum.optional(),
  absence_reason: z.string().optional(),
  notes: z.string().optional(),
})

// ============================================
// ATHLETE SCHEMAS
// ============================================

export const CreateAthleteSchema = z.object({
  name: z.string().min(1).max(255),
  date_of_birth: DateSchema.optional(),
  gender: GenderEnum.optional(),
  category: CategoryEnum.optional(),
  main_stroke: StrokeEnum.optional(),
  css_velocity: z.number().optional(),
  target_t1: z.number().optional(),
  target_t2: z.number().optional(),
  target_t3: z.number().optional(),
  notes: z.string().optional(),
})

export const UpdateAthleteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  date_of_birth: DateSchema.optional(),
  gender: GenderEnum.optional(),
  category: CategoryEnum.optional(),
  main_stroke: StrokeEnum.optional(),
  css_velocity: z.number().optional(),
  target_t1: z.number().optional(),
  target_t2: z.number().optional(),
  target_t3: z.number().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
})

// ============================================
// TRIAL RESULT SCHEMAS
// ============================================

export const CreateTrialResultSchema = z.object({
  athlete_id: UUIDSchema,
  trial_number: z.enum(['1', '2', '3']).transform(v => parseInt(v) as 1 | 2 | 3),
  trial_date: DateSchema,
  event: z.string().min(1).max(255),
  actual_time: z.number().min(0),
  target_time: z.number().min(0).optional(),
  stroke: StrokeEnum.optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  stroke_rate: z.number().optional(),
  notes: z.string().optional(),
})

export const UpdateTrialResultSchema = z.object({
  trial_date: DateSchema.optional(),
  event: z.string().min(1).max(255).optional(),
  actual_time: z.number().min(0).optional(),
  target_time: z.number().min(0).optional(),
  stroke: StrokeEnum.optional(),
  rpe: z.number().int().min(1).max(10).optional(),
  stroke_rate: z.number().optional(),
  notes: z.string().optional(),
})

// ============================================
// QUERY SCHEMAS
// ============================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export const FilterSchema = z.object({
  academy_id: UUIDSchema.optional(),
  coach_id: UUIDSchema.optional(),
  athlete_id: UUIDSchema.optional(),
  season_id: UUIDSchema.optional(),
  weekly_plan_id: UUIDSchema.optional(),
  session_id: UUIDSchema.optional(),
  status: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
})

// ============================================
// EXPORT TYPES
// ============================================

export type CreateWeeklyPlanInput = z.infer<typeof CreateWeeklyPlanSchema>
export type UpdateWeeklyPlanInput = z.infer<typeof UpdateWeeklyPlanSchema>
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>
export type CreateDrillInput = z.infer<typeof CreateDrillSchema>
export type UpdateDrillInput = z.infer<typeof UpdateDrillSchema>
export type CreateAttendanceInput = z.infer<typeof CreateAttendanceSchema>
export type UpdateAttendanceInput = z.infer<typeof UpdateAttendanceSchema>
export type CreateAthleteInput = z.infer<typeof CreateAthleteSchema>
export type UpdateAthleteInput = z.infer<typeof UpdateAthleteSchema>
export type CreateTrialResultInput = z.infer<typeof CreateTrialResultSchema>
export type UpdateTrialResultInput = z.infer<typeof UpdateTrialResultSchema>
export type PaginationInput = z.infer<typeof PaginationSchema>
export type FilterInput = z.infer<typeof FilterSchema>
