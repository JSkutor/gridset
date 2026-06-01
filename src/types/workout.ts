export type Id = string;
export type Timestamp = string;

export type ExerciseCategory =
  | 'strength'
  | 'stretching'
  | 'cardio'
  | 'plyometrics'
  | 'powerlifting';

export type ExerciseUnit = 'kg' | 'reps' | 'sec';
export type SetSide = 'L' | 'R' | 'both';

export interface BaseEntity {
  id: Id;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export interface AppUser {
  id: Id;
  name: string;
  email?: string;
  isGuest: boolean;
}

export interface Routine extends BaseEntity {
  name: string;
  user_id: Id;
}

export interface Session extends BaseEntity {
  name: string;
  routine_id: Id;
  session_order: number;
  user_id: Id;
  color?: string;
}

export interface Exercise extends BaseEntity {
  name: string;
  englishName?: string | null;
  english_name?: string | null;
  primary_muscle: string;
  primaryMuscle?: string;
  secondaryMuscles: string[];
  secondary_muscles?: string[];
  equipment: string;
  category: ExerciseCategory;
  unit: ExerciseUnit;
  is_unilateral: boolean;
  synonyms: string[];
  user_id?: Id | null;
}

export interface SessionExercise extends BaseEntity {
  session_id: Id;
  exercise_id: Id;
  order: number;
  target_sets: number;
  target_record: string | number;
  rest_between_sets?: number;
  rest_after_exercise?: number;
}

export interface SessionExerciseGroup extends BaseEntity {
  session_id: Id;
  name: string;
  start_order: number;
  size: number;
  color: string;
}

export interface WorkoutLog extends BaseEntity {
  user_id: Id;
  session_id: Id;
  start_time: Timestamp;
  end_time?: Timestamp | null;
}

export interface SetRecord extends BaseEntity {
  workout_log_id: Id;
  exercise_id: Id;
  set_number: number;
  weight?: number | string | null;
  record: number | string;
  side?: SetSide;
  memo?: string | null;
}
