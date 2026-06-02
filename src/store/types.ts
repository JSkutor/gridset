import type { AuthChangeEvent, Session as AuthSession } from '@supabase/supabase-js';
import type { StateCreator } from 'zustand';
import type {
  AppUser,
  Exercise,
  ExerciseUnit,
  Id,
  Routine,
  Session,
  SessionExercise,
  SessionExerciseGroup,
  SetRecord,
  SetSide,
  Timestamp,
  WorkoutLog,
} from '../types/workout.js';

export type RemoteSyncError = {
  label: string;
  message: string;
  failedAt: Timestamp;
  pendingCount: number;
  isRetrying: boolean;
};

export type RemoteSyncOptions = {
  dedupKey?: string;
};

export type RemoteSyncTask = () => Promise<unknown>;

export type WorkoutDataState = {
  exercises: Exercise[];
  routines: Routine[];
  sessions: Session[];
  sessionExercises: SessionExercise[];
  sessionExerciseGroups: SessionExerciseGroup[];
  workoutLogs: WorkoutLog[];
  setRecords: SetRecord[];
  hasClearedDemoData: boolean;
};

export type AuthSlice = {
  currentUser: AppUser;
  isSyncing: boolean;
  authSession: AuthSession | null;
  remoteSyncError: RemoteSyncError | null;
  runRemoteSync: (
    label: string,
    task: RemoteSyncTask,
    options?: RemoteSyncOptions,
  ) => void;
  retryFailedRemoteSync: () => Promise<void>;
  clearRemoteSyncError: () => void;
  setAuthSession: (
    session: AuthSession | null,
    event?: AuthChangeEvent,
  ) => Promise<void>;
  fetchUserData: () => Promise<void>;
  discardGuestLocalDataForSignUp: () => void;
  seedDemoData: () => Promise<void>;
};

export type ExerciseUpdate = Partial<
  Pick<
    Exercise,
    | 'name'
    | 'englishName'
    | 'english_name'
    | 'primary_muscle'
    | 'primaryMuscle'
    | 'secondaryMuscles'
    | 'secondary_muscles'
    | 'equipment'
    | 'category'
    | 'unit'
    | 'is_unilateral'
    | 'synonyms'
  >
>;

export type ExerciseSlice = {
  addExercise: (
    name: string,
    primary_muscle?: string | null,
    equipment?: string | null,
    unit?: ExerciseUnit,
    is_unilateral?: boolean,
  ) => Exercise;
  deleteExercise: (id: Id) => void;
  updateExercise: (id: Id, updates: ExerciseUpdate) => void;
  fetchPublicExercises: () => Promise<void>;
  syncExercisesForReferences: (
    exerciseIds: Array<Id | null | undefined>,
    userId: Id | null | undefined,
  ) => Promise<void>;
};

export type SessionExerciseUpdate = Partial<
  Pick<
    SessionExercise,
    | 'exercise_id'
    | 'order'
    | 'target_sets'
    | 'target_record'
    | 'rest_between_sets'
    | 'rest_after_exercise'
  >
>;

export type SessionExerciseGroupUpdate = Partial<
  Pick<SessionExerciseGroup, 'name' | 'start_order' | 'size' | 'color'>
>;

export type RoutineSlice = {
  addRoutine: (name: string) => Routine;
  deleteRoutine: (id: Id) => void;
  updateRoutine: (id: Id, name: string) => void;
  duplicateRoutine: (sourceRoutineId: Id) => Routine | null;
  addSession: (routine_id: Id, name: string) => Session | null;
  createTemporarySession: (routine_id: Id, name?: string) => Session | null;
  deleteSession: (id: Id) => void;
  updateSession: (id: Id, name: string) => void;
  reorderSessions: (routine_id: Id, orderedSessionIds: Id[]) => void;
  addSessionExercise: (
    session_id: Id,
    exercise_id: Id,
    order: number,
    target_sets: number,
    target_record: string | number,
  ) => SessionExercise;
  deleteSessionExercise: (id: Id) => void;
  updateSessionExercise: (id: Id, updates: SessionExerciseUpdate) => void;
  reorderSessionExercises: (
    session_id: Id,
    orderedExerciseLinkIds: Id[],
  ) => void;
  addSessionExerciseGroup: (
    session_id: Id,
    name: string,
    size?: number | string,
  ) => SessionExerciseGroup | null;
  updateSessionExerciseGroup: (
    id: Id,
    updates: SessionExerciseGroupUpdate,
  ) => SessionExerciseGroup | null;
  deleteSessionExerciseGroup: (id: Id) => void;
};

export type WorkoutLogSetDraft = {
  exercise_id?: Id | null;
  set_number: number;
  weight: string | number;
  reps?: string | number | null;
  side?: SetSide;
  memo?: string | null;
};

export type WorkoutLogBlockDraft = {
  exercise_id: Id;
  sets: WorkoutLogSetDraft[];
};

export type SetRecordUpdate = Partial<
  Pick<SetRecord, 'weight' | 'record' | 'side' | 'memo'>
>;

export type WorkoutLogSlice = {
  startWorkoutLog: (session_id: Id) => WorkoutLog;
  finishWorkoutLog: (id: Id) => void;
  deleteWorkoutLog: (id: Id) => void;
  saveWorkoutLog: (
    session_id: Id,
    blocks: WorkoutLogBlockDraft[],
    start_time?: Timestamp,
  ) => WorkoutLog;
  addSetRecord: (
    workout_log_id: Id,
    exercise_id: Id,
    set_number: number,
    weight: string | number,
    record: string | number,
    side?: SetSide,
    memo?: string | null,
  ) => SetRecord;
  updateSetRecord: (id: Id, updates: SetRecordUpdate) => void;
  deleteSetRecord: (id: Id) => void;
  clearAllData: () => void;
  generateDummyData: () => Promise<void>;
  isRoutineReadOnly: (routineId: Id | null | undefined) => boolean;
};

export type WorkoutStore = WorkoutDataState &
  AuthSlice &
  ExerciseSlice &
  RoutineSlice &
  WorkoutLogSlice;

export type StoreSlice<T> = StateCreator<WorkoutStore, [], [], T>;
