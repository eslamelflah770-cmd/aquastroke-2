-- AQUASTROKE Database Schema
-- Comprehensive swimming training management system

-- ============================================
-- ENUMS & TYPES
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'coach', 'parent', 'athlete');
CREATE TYPE session_phase AS ENUM ('GPP', 'SPP1', 'SPP2', 'COMP', 'TAPER', 'CHAMP');
CREATE TYPE athlete_category AS ENUM ('Sprint', 'Middle', 'Distance');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'excused', 'pending');
CREATE TYPE trial_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE stroke_type AS ENUM ('Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'IM');

-- ============================================
-- CORE TABLES
-- ============================================

-- Organizations/Academies
CREATE TABLE academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  country TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'coach', 'academy', 'elite')),
  max_athletes INT DEFAULT 5,
  max_coaches INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Authentication via Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  academy_id UUID REFERENCES academies(id) ON DELETE SET NULL,
  role user_role NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaches
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  specialization TEXT,
  bio TEXT,
  certification TEXT,
  experience_years INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Athletes/Swimmers
CREATE TABLE athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('M', 'F')),
  category athlete_category DEFAULT 'Middle',
  main_stroke stroke_type,
  css_velocity NUMERIC(6,3),
  target_t1 NUMERIC(8,2),
  target_t2 NUMERIC(8,2),
  target_t3 NUMERIC(8,2),
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parents/Guardians
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  relationship TEXT CHECK (relationship IN ('father', 'mother', 'guardian')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent-Athlete Relationships
CREATE TABLE parent_athlete_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (parent_id, athlete_id)
);

-- ============================================
-- TRAINING PLAN TABLES
-- ============================================

-- Seasons (36-week training cycles)
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '2025/2026',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  current_week INT DEFAULT 1 CHECK (current_week BETWEEN 1 AND 36),
  current_phase session_phase DEFAULT 'GPP',
  volume_gpp INT,
  volume_spp1 INT,
  volume_spp2 INT,
  volume_comp INT,
  volume_taper INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly Training Plans
CREATE TABLE weekly_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 36),
  phase session_phase NOT NULL,
  total_volume INT,
  intensity_level INT CHECK (intensity_level BETWEEN 1 AND 10),
  focus_area TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (season_id, week_number)
);

-- Daily Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_plan_id UUID NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_number INT CHECK (session_number BETWEEN 1 AND 6),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INT,
  total_distance INT,
  intensity_level INT CHECK (intensity_level BETWEEN 1 AND 10),
  focus_area TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Drills/Sets
CREATE TABLE drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  sequence INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  distance INT,
  duration_minutes INT,
  stroke stroke_type,
  intensity TEXT,
  pace_target TEXT,
  equipment TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ATTENDANCE & PERFORMANCE TABLES
-- ============================================

-- Attendance Records
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  status attendance_status DEFAULT 'pending',
  marked_by UUID REFERENCES coaches(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ,
  absence_reason TEXT,
  absence_request_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, athlete_id)
);

-- Absence Requests (Parents request permission for absence)
CREATE TABLE absence_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES coaches(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trial Results (Performance benchmarks)
CREATE TABLE trial_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  trial_number INT NOT NULL CHECK (trial_number IN (1, 2, 3)),
  trial_date DATE NOT NULL,
  event TEXT NOT NULL,
  actual_time NUMERIC(8,2) NOT NULL,
  target_time NUMERIC(8,2),
  gap_percent NUMERIC(6,2),
  stroke stroke_type,
  rpe INT CHECK (rpe BETWEEN 1 AND 10),
  stroke_rate NUMERIC(5,1),
  notes TEXT,
  recorded_by UUID REFERENCES coaches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (athlete_id, trial_number)
);

-- Progress Tracking
CREATE TABLE progress_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  week_number INT CHECK (week_number BETWEEN 1 AND 36),
  total_sessions_planned INT,
  total_sessions_attended INT,
  attendance_percentage NUMERIC(5,2),
  average_rpe NUMERIC(4,2),
  performance_trend TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATION & COMMUNICATION TABLES
-- ============================================

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('session_reminder', 'absence_request', 'trial_scheduled', 'performance_update', 'general')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  related_entity_type TEXT,
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (Coach-Parent Communication)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT & LOGGING
-- ============================================

-- Audit Log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_users_academy ON users(academy_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_coaches_academy ON coaches(academy_id);
CREATE INDEX idx_athletes_academy ON athletes(academy_id);
CREATE INDEX idx_athletes_coach ON athletes(coach_id);
CREATE INDEX idx_athletes_active ON athletes(academy_id, is_active);
CREATE INDEX idx_parents_academy ON parents(academy_id);
CREATE INDEX idx_seasons_academy ON seasons(academy_id);
CREATE INDEX idx_seasons_active ON seasons(academy_id, is_active);
CREATE INDEX idx_weekly_plans_season ON weekly_plans(season_id);
CREATE INDEX idx_sessions_weekly_plan ON sessions(weekly_plan_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_drills_session ON drills(session_id);
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_athlete ON attendance(athlete_id);
CREATE INDEX idx_attendance_status ON attendance(status);
CREATE INDEX idx_absence_requests_athlete ON absence_requests(athlete_id);
CREATE INDEX idx_absence_requests_status ON absence_requests(status);
CREATE INDEX idx_trial_results_athlete ON trial_results(athlete_id);
CREATE INDEX idx_trial_results_trial_number ON trial_results(athlete_id, trial_number);
CREATE INDEX idx_progress_athlete ON progress_tracking(athlete_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_messages_recipient ON messages(recipient_id, is_read);
CREATE INDEX idx_audit_logs_academy ON audit_logs(academy_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['academies', 'users', 'coaches', 'athletes', 'parents', 'seasons', 'weekly_plans', 'sessions', 'drills', 'attendance', 'trial_results', 'progress_tracking', 'notifications', 'messages']
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS update_' || t || '_updated_at ON ' || t;
    EXECUTE 'CREATE TRIGGER update_' || t || '_updated_at BEFORE UPDATE ON ' || t || ' FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()';
  END LOOP;
END $$;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "users_view_own" ON users
  FOR SELECT USING (auth.uid() = id);

-- Coaches can view academy data
CREATE POLICY "coaches_view_academy" ON athletes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coaches
      WHERE coaches.user_id = auth.uid()
      AND coaches.academy_id = athletes.academy_id
    )
  );

-- Parents can view their own children
CREATE POLICY "parents_view_children" ON athletes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_athlete_links
      WHERE parent_athlete_links.athlete_id = athletes.id
      AND parent_athlete_links.parent_id IN (
        SELECT id FROM parents WHERE parents.user_id = auth.uid()
      )
    )
  );

-- Attendance visibility
CREATE POLICY "attendance_view_own_academy" ON attendance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM athletes
      WHERE athletes.id = attendance.athlete_id
      AND (
        EXISTS (
          SELECT 1 FROM coaches
          WHERE coaches.user_id = auth.uid()
          AND coaches.academy_id = athletes.academy_id
        )
        OR
        EXISTS (
          SELECT 1 FROM parent_athlete_links
          WHERE parent_athlete_links.athlete_id = athletes.id
          AND parent_athlete_links.parent_id IN (
            SELECT id FROM parents WHERE parents.user_id = auth.uid()
          )
        )
      )
    )
  );

SELECT 'AQUASTROKE Database Schema Created Successfully ✓' AS status;
