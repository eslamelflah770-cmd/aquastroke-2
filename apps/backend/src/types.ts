/**
 * AQUASTROKE Backend - Type Definitions
 * Comprehensive type definitions for all API entities
 */

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'coach' | 'parent' | 'athlete'
  academy_id?: string
}

export interface AuthRequest extends Express.Request {
  user?: AuthUser
}

// ============================================
// ACADEMY & USER TYPES
// ============================================

export interface Academy {
  id: string
  name: string
  slug: string
  description?: string
  logo_url?: string
  country?: string
  city?: string
  phone?: string
  email?: string
  subscription_plan: 'free' | 'coach' | 'academy' | 'elite'
  max_athletes: number
  max_coaches: number
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  academy_id?: string
  role: 'admin' | 'coach' | 'parent' | 'athlete'
  display_name: string
  avatar_url?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Coach {
  id: string
  user_id: string
  academy_id: string
  specialization?: string
  bio?: string
  certification?: string
  experience_years?: number
  created_at: string
  updated_at: string
}

export interface Athlete {
  id: string
  academy_id: string
  coach_id?: string
  name: string
  date_of_birth?: string
  gender?: 'M' | 'F'
  category: 'Sprint' | 'Middle' | 'Distance'
  main_stroke?: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'IM'
  css_velocity?: number
  target_t1?: number
  target_t2?: number
  target_t3?: number
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Parent {
  id: string
  user_id: string
  academy_id: string
  relationship: 'father' | 'mother' | 'guardian'
  created_at: string
  updated_at: string
}

// ============================================
// TRAINING PLAN TYPES
// ============================================

export interface Season {
  id: string
  academy_id: string
  label: string
  start_date: string
  end_date: string
  current_week: number
  current_phase: 'GPP' | 'SPP1' | 'SPP2' | 'COMP' | 'TAPER' | 'CHAMP'
  volume_gpp?: number
  volume_spp1?: number
  volume_spp2?: number
  volume_comp?: number
  volume_taper?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WeeklyPlan {
  id: string
  season_id: string
  academy_id: string
  week_number: number
  phase: 'GPP' | 'SPP1' | 'SPP2' | 'COMP' | 'TAPER' | 'CHAMP'
  total_volume?: number
  intensity_level?: number
  focus_area?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Session {
  id: string
  weekly_plan_id: string
  academy_id: string
  session_date: string
  session_number?: number
  title: string
  description?: string
  duration_minutes?: number
  total_distance?: number
  intensity_level?: number
  focus_area?: string
  created_at: string
  updated_at: string
}

export interface Drill {
  id: string
  session_id: string
  academy_id: string
  sequence: number
  title: string
  description?: string
  distance?: number
  duration_minutes?: number
  stroke?: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'IM'
  intensity?: string
  pace_target?: string
  equipment?: string
  notes?: string
  created_at: string
  updated_at: string
}

// ============================================
// ATTENDANCE & PERFORMANCE TYPES
// ============================================

export interface Attendance {
  id: string
  session_id: string
  athlete_id: string
  academy_id: string
  status: 'present' | 'absent' | 'excused' | 'pending'
  marked_by?: string
  marked_at?: string
  absence_reason?: string
  absence_request_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface AbsenceRequest {
  id: string
  athlete_id: string
  parent_id: string
  academy_id: string
  session_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface TrialResult {
  id: string
  athlete_id: string
  academy_id: string
  trial_number: 1 | 2 | 3
  trial_date: string
  event: string
  actual_time: number
  target_time?: number
  gap_percent?: number
  stroke?: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'IM'
  rpe?: number
  stroke_rate?: number
  notes?: string
  recorded_by?: string
  created_at: string
  updated_at: string
}

export interface ProgressTracking {
  id: string
  athlete_id: string
  academy_id: string
  week_number?: number
  total_sessions_planned?: number
  total_sessions_attended?: number
  attendance_percentage?: number
  average_rpe?: number
  performance_trend?: string
  notes?: string
  created_at: string
  updated_at: string
}

// ============================================
// NOTIFICATION & MESSAGE TYPES
// ============================================

export interface Notification {
  id: string
  academy_id: string
  recipient_id: string
  type: 'session_reminder' | 'absence_request' | 'trial_scheduled' | 'performance_update' | 'general'
  title: string
  body: string
  related_entity_type?: string
  related_entity_id?: string
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  academy_id: string
  sender_id: string
  recipient_id: string
  athlete_id?: string
  subject?: string
  body: string
  is_read: boolean
  read_at?: string
  created_at: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface ErrorResponse {
  success: false
  error: string
  code: string
  timestamp: string
  path?: string
}

// ============================================
// REQUEST VALIDATION TYPES
// ============================================

export interface CreateWeeklyPlanRequest {
  season_id: string
  week_number: number
  phase: 'GPP' | 'SPP1' | 'SPP2' | 'COMP' | 'TAPER' | 'CHAMP'
  total_volume?: number
  intensity_level?: number
  focus_area?: string
  notes?: string
}

export interface UpdateWeeklyPlanRequest {
  week_number?: number
  phase?: 'GPP' | 'SPP1' | 'SPP2' | 'COMP' | 'TAPER' | 'CHAMP'
  total_volume?: number
  intensity_level?: number
  focus_area?: string
  notes?: string
}

export interface CreateSessionRequest {
  weekly_plan_id: string
  session_date: string
  session_number?: number
  title: string
  description?: string
  duration_minutes?: number
  total_distance?: number
  intensity_level?: number
  focus_area?: string
}

export interface UpdateSessionRequest {
  session_date?: string
  session_number?: number
  title?: string
  description?: string
  duration_minutes?: number
  total_distance?: number
  intensity_level?: number
  focus_area?: string
}

export interface CreateDrillRequest {
  session_id: string
  sequence: number
  title: string
  description?: string
  distance?: number
  duration_minutes?: number
  stroke?: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'IM'
  intensity?: string
  pace_target?: string
  equipment?: string
  notes?: string
}

export interface UpdateDrillRequest {
  sequence?: number
  title?: string
  description?: string
  distance?: number
  duration_minutes?: number
  stroke?: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'IM'
  intensity?: string
  pace_target?: string
  equipment?: string
  notes?: string
}

export interface CreateAttendanceRequest {
  session_id: string
  athlete_id: string
  status: 'present' | 'absent' | 'excused' | 'pending'
  absence_reason?: string
  notes?: string
}

export interface UpdateAttendanceRequest {
  status?: 'present' | 'absent' | 'excused' | 'pending'
  absence_reason?: string
  notes?: string
}

export interface CreateAthleteRequest {
  name: string
  date_of_birth?: string
  gender?: 'M' | 'F'
  category?: 'Sprint' | 'Middle' | 'Distance'
  main_stroke?: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'IM'
  css_velocity?: number
  target_t1?: number
  target_t2?: number
  target_t3?: number
  notes?: string
}

export interface UpdateAthleteRequest {
  name?: string
  date_of_birth?: string
  gender?: 'M' | 'F'
  category?: 'Sprint' | 'Middle' | 'Distance'
  main_stroke?: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'IM'
  css_velocity?: number
  target_t1?: number
  target_t2?: number
  target_t3?: number
  notes?: string
  is_active?: boolean
}

export interface CreateTrialResultRequest {
  athlete_id: string
  trial_number: 1 | 2 | 3
  trial_date: string
  event: string
  actual_time: number
  target_time?: number
  stroke?: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'IM'
  rpe?: number
  stroke_rate?: number
  notes?: string
}

export interface UpdateTrialResultRequest {
  trial_date?: string
  event?: string
  actual_time?: number
  target_time?: number
  stroke?: 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'IM'
  rpe?: number
  stroke_rate?: number
  notes?: string
}
