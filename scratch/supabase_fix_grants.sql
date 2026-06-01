-- Run this in the Supabase SQL Editor if PostgREST returns:
-- "permission denied for table ..."

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON public.exercises TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.routines TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_exercises TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_exercise_groups TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_logs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.set_records TO authenticated, service_role;
