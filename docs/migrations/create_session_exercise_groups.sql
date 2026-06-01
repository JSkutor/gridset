-- Migration: create session_exercise_groups table
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

create table if not exists public.session_exercise_groups (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.sessions(id) on delete cascade,
  name        text not null default '',
  start_order integer not null,
  size        integer not null,
  color       text not null default '#7aa2f7',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for the join used in fetchUserWorkoutData
create index if not exists idx_session_exercise_groups_session_id
  on public.session_exercise_groups(session_id);

-- API grants
grant select, insert, update, delete on public.session_exercise_groups to authenticated, service_role;

-- RLS
alter table public.session_exercise_groups enable row level security;

-- Users can read/write groups that belong to their own sessions
create policy "Users manage their own session_exercise_groups"
  on public.session_exercise_groups
  for all
  using (
    exists (
      select 1
      from public.sessions s
      where s.id = session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sessions s
      where s.id = session_id
        and s.user_id = auth.uid()
    )
  );
