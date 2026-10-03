import { boolean, date, index, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const memberRole = pgEnum('member_role', ['admin', 'coach', 'parent', 'athlete'])
export const trainingPhase = pgEnum('training_phase', ['GPP', 'SPP1', 'SPP2', 'COMP', 'TAPER', 'CHAMP'])
export const strokeType = pgEnum('stroke_type', ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'IM'])
export const attendanceStatus = pgEnum('attendance_status', ['present', 'absent', 'excused', 'pending'])

function timestamps() {
  return {
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  }
}

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  display_name: text('display_name').notNull(),
  ...timestamps(),
})

export const academies = pgTable('academies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  city: text('city'),
  country: text('country'),
  phone: text('phone'),
  description: text('description'),
  created_by: uuid('created_by').notNull().references(() => users.id),
  ...timestamps(),
})

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  academy_id: uuid('academy_id').notNull().references(() => academies.id, { onDelete: 'cascade' }),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: memberRole('role').notNull(),
  ...timestamps(),
}, (table) => [uniqueIndex('memberships_academy_user').on(table.academy_id, table.user_id)])

function academyFields() {
  return {
    id: uuid('id').primaryKey().defaultRandom(),
    academy_id: uuid('academy_id').notNull().references(() => academies.id, { onDelete: 'cascade' }),
    ...timestamps(),
  }
}

export const coaches = pgTable('coaches', {
  ...academyFields(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  specialization: text('specialization'),
  certification: text('certification'),
}, (table) => [uniqueIndex('coaches_academy_user').on(table.academy_id, table.user_id)])

export const athletes = pgTable('athletes', {
  ...academyFields(),
  user_id: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  coach_id: uuid('coach_id').references(() => coaches.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  date_of_birth: date('date_of_birth'),
  gender: text('gender'),
  category: text('category').notNull().default('Middle'),
  main_stroke: strokeType('main_stroke'),
  css_velocity: numeric('css_velocity'),
  target_t1: numeric('target_t1'),
  target_t2: numeric('target_t2'),
  target_t3: numeric('target_t3'),
  notes: text('notes'),
  is_active: boolean('is_active').notNull().default(true),
}, (table) => [index('athletes_academy').on(table.academy_id)])

export const parents = pgTable('parents', {
  ...academyFields(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  relationship: text('relationship').notNull().default('guardian'),
}, (table) => [uniqueIndex('parents_academy_user').on(table.academy_id, table.user_id)])

export const parentAthleteLinks = pgTable('parent_athlete_links', {
  ...academyFields(),
  parent_id: uuid('parent_id').notNull().references(() => parents.id, { onDelete: 'cascade' }),
  athlete_id: uuid('athlete_id').notNull().references(() => athletes.id, { onDelete: 'cascade' }),
}, (table) => [uniqueIndex('parent_athlete_pair').on(table.parent_id, table.athlete_id)])

export const seasons = pgTable('seasons', {
  ...academyFields(),
  name: text('name').notNull(),
  start_date: date('start_date').notNull(),
  end_date: date('end_date').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  notes: text('notes'),
})

export const weeklyPlans = pgTable('weekly_plans', {
  ...academyFields(),
  season_id: uuid('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  week_number: integer('week_number').notNull(),
  phase: trainingPhase('phase').notNull(),
  total_volume: integer('total_volume'),
  intensity_level: integer('intensity_level'),
  focus_area: text('focus_area'),
  notes: text('notes'),
}, (table) => [uniqueIndex('weekly_plans_season_week').on(table.season_id, table.week_number)])

export const sessions = pgTable('sessions', {
  ...academyFields(),
  weekly_plan_id: uuid('weekly_plan_id').notNull().references(() => weeklyPlans.id, { onDelete: 'cascade' }),
  session_date: date('session_date').notNull(),
  session_number: integer('session_number'),
  title: text('title').notNull(),
  description: text('description'),
  duration_minutes: integer('duration_minutes'),
  total_distance: integer('total_distance'),
  intensity_level: integer('intensity_level'),
  focus_area: text('focus_area'),
})

export const drills = pgTable('drills', {
  ...academyFields(),
  session_id: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  sequence: integer('sequence').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  distance: integer('distance'),
  duration_minutes: integer('duration_minutes'),
  stroke: strokeType('stroke'),
  intensity: text('intensity'),
  pace_target: text('pace_target'),
  equipment: text('equipment'),
  notes: text('notes'),
})

export const attendance = pgTable('attendance', {
  ...academyFields(),
  session_id: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  athlete_id: uuid('athlete_id').notNull().references(() => athletes.id, { onDelete: 'cascade' }),
  status: attendanceStatus('status').notNull(),
  absence_reason: text('absence_reason'),
  notes: text('notes'),
  recorded_by: uuid('recorded_by').notNull().references(() => users.id),
}, (table) => [uniqueIndex('attendance_session_athlete').on(table.session_id, table.athlete_id)])

export const absenceRequests = pgTable('absence_requests', {
  ...academyFields(),
  session_id: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  athlete_id: uuid('athlete_id').notNull().references(() => athletes.id, { onDelete: 'cascade' }),
  parent_id: uuid('parent_id').notNull().references(() => parents.id, { onDelete: 'cascade' }),
  reason: text('reason').notNull(),
  status: text('status').notNull().default('pending'),
})

export const trialResults = pgTable('trial_results', {
  ...academyFields(),
  athlete_id: uuid('athlete_id').notNull().references(() => athletes.id, { onDelete: 'cascade' }),
  trial_number: integer('trial_number').notNull(),
  trial_date: date('trial_date').notNull(),
  event: text('event').notNull(),
  actual_time: numeric('actual_time').notNull(),
  target_time: numeric('target_time'),
  stroke: strokeType('stroke'),
  rpe: integer('rpe'),
  stroke_rate: numeric('stroke_rate'),
  notes: text('notes'),
  recorded_by: uuid('recorded_by').notNull().references(() => users.id),
}, (table) => [uniqueIndex('trial_results_athlete_trial').on(table.athlete_id, table.trial_number)])

export const progressTracking = pgTable('progress_tracking', {
  ...academyFields(),
  athlete_id: uuid('athlete_id').notNull().references(() => athletes.id, { onDelete: 'cascade' }),
  tracking_date: date('tracking_date').notNull(),
  metric: text('metric').notNull(),
  value: numeric('value').notNull(),
  notes: text('notes'),
})

export const notifications = pgTable('notifications', {
  ...academyFields(),
  recipient_id: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  is_read: boolean('is_read').notNull().default(false),
})

export const messages = pgTable('messages', {
  ...academyFields(),
  sender_id: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipient_id: uuid('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  is_read: boolean('is_read').notNull().default(false),
})

export const auditLogs = pgTable('audit_logs', {
  ...academyFields(),
  user_id: uuid('user_id').notNull().references(() => users.id),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  record_id: uuid('record_id').notNull(),
  details: jsonb('details').$type<Record<string, string>>().notNull().default({}),
})
