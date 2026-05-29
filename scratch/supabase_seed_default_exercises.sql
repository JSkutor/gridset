-- Run this once in the Supabase SQL Editor after the tables exist.
-- These public exercise rows are referenced by templates and workout logs.

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
