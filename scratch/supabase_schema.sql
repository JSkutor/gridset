-- GridSet Supabase Database Schema DDL
-- 복사하여 Supabase SQL Editor에 붙여넣고 실행하세요.

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clean existing tables if needed (optional - uncomment if resetting)
-- DROP TABLE IF EXISTS public.set_records CASCADE;
-- DROP TABLE IF EXISTS public.workout_logs CASCADE;
-- DROP TABLE IF EXISTS public.session_exercises CASCADE;
-- DROP TABLE IF EXISTS public.exercises CASCADE;
-- DROP TABLE IF EXISTS public.sessions CASCADE;
-- DROP TABLE IF EXISTS public.routines CASCADE;

-- 2. routines Table
CREATE TABLE public.routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. sessions Table
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
    session_order INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. exercises Table
CREATE TABLE public.exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    english_name TEXT,
    primary_muscle TEXT NOT NULL,
    secondary_muscles TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    equipment TEXT NOT NULL,
    category TEXT DEFAULT 'strength' NOT NULL,
    unit TEXT DEFAULT 'kg' NOT NULL,
    is_unilateral BOOLEAN DEFAULT false NOT NULL,
    synonyms TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL means public/default exercise
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. session_exercises Table
CREATE TABLE public.session_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    target_sets INTEGER NOT NULL,
    target_record TEXT NOT NULL,
    rest_between_sets INTEGER DEFAULT 90 NOT NULL,
    rest_after_exercise INTEGER DEFAULT 120 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. workout_logs Table
CREATE TABLE public.workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. set_records Table
CREATE TABLE public.set_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    weight NUMERIC,
    record TEXT NOT NULL,
    side TEXT DEFAULT 'both' NOT NULL,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------
-- Enable Row Level Security (RLS)
-- ----------------------------------------------------
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_records ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Define RLS Policies
-- ----------------------------------------------------

-- Routines
CREATE POLICY "Users can manage their own routines" ON public.routines
    FOR ALL USING (auth.uid() = user_id);

-- Sessions
CREATE POLICY "Users can manage their own sessions" ON public.sessions
    FOR ALL USING (auth.uid() = user_id);

-- Exercises
CREATE POLICY "Users can view public or their own exercises" ON public.exercises
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom exercises" ON public.exercises
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update/delete their own custom exercises" ON public.exercises
    FOR ALL USING (auth.uid() = user_id);

-- Session Exercises
CREATE POLICY "Users can manage their own session exercises" ON public.session_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sessions s 
            WHERE s.id = session_id AND s.user_id = auth.uid()
        )
    );

-- Workout Logs
CREATE POLICY "Users can manage their own workout logs" ON public.workout_logs
    FOR ALL USING (auth.uid() = user_id);

-- Set Records
CREATE POLICY "Users can manage their own set records" ON public.set_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_logs l 
            WHERE l.id = workout_log_id AND l.user_id = auth.uid()
        )
    );

-- ----------------------------------------------------
-- Performance Indexes
-- ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_routines_user ON public.routines(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_routine ON public.sessions(routine_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_user ON public.exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_session_exercises_session ON public.session_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_set_records_log ON public.set_records(workout_log_id);

-- ----------------------------------------------------
-- Public Default Exercises
-- ----------------------------------------------------
-- These rows are shared by every user and are referenced by client-side default templates.
INSERT INTO public.exercises (
  id,
  name,
  english_name,
  primary_muscle,
  secondary_muscles,
  equipment,
  category,
  unit,
  is_unilateral,
  synonyms,
  user_id
) VALUES
  ('00000000-0000-4000-8000-000000000001', '벤치프레스', null, '대흉근', '{}'::text[], '바벨', 'strength', 'kg', false, '{}'::text[], null),
  ('00000000-0000-4000-8000-000000000002', '스쿼트', null, '대퇴사두', '{}'::text[], '바벨', 'strength', 'kg', false, '{}'::text[], null),
  ('00000000-0000-4000-8000-000000000003', '데드리프트', null, '척추기립근', '{}'::text[], '바벨', 'strength', 'kg', false, '{}'::text[], null),
  ('00000000-0000-4000-8000-000000000004', '풀업', null, '광배근', '{}'::text[], '맨몸', 'strength', 'kg', false, '{}'::text[], null),
  ('00000000-0000-4000-8000-000000000005', '바벨 로우', null, '광배근', '{}'::text[], '바벨', 'strength', 'kg', false, '{}'::text[], null),
  ('00000000-0000-4000-8000-000000000006', '오버헤드 프레스', null, '삼각근', '{}'::text[], '바벨', 'strength', 'kg', false, '{}'::text[], null),
  ('00000000-0000-4000-8000-000000000007', '바벨 컬', null, '상완이두근', '{}'::text[], '바벨', 'strength', 'kg', false, '{}'::text[], null),
  ('00000000-0000-4000-8000-000000000008', '레그 익스텐션', null, '대퇴사두', '{}'::text[], '머신', 'strength', 'kg', false, '{}'::text[], null),
  ('00000000-0000-4000-8000-000000000009', '푸시업', null, '대흉근', '{}'::text[], '맨몸', 'strength', 'reps', false, '{}'::text[], null),
  ('00000000-0000-4000-8000-000000000010', '플랭크', null, '복근', '{}'::text[], '맨몸', 'strength', 'sec', false, '{}'::text[], null)
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  english_name = excluded.english_name,
  primary_muscle = excluded.primary_muscle,
  secondary_muscles = excluded.secondary_muscles,
  equipment = excluded.equipment,
  category = excluded.category,
  unit = excluded.unit,
  is_unilateral = excluded.is_unilateral,
  synonyms = excluded.synonyms,
  user_id = null,
  updated_at = timezone('utc'::text, now());

-- ----------------------------------------------------
-- API Grants
-- ----------------------------------------------------
-- Supabase PostgREST requires both table privileges and passing RLS policies.
-- Without these grants the client receives "permission denied for table ..." before RLS is evaluated.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.exercises TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.routines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_exercises TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.set_records TO authenticated;
