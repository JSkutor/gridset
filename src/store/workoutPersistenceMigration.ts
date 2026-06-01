import { CATALOG_EXERCISE_BY_NAME, normalizeExerciseForApp } from '../api/supabaseWorkoutRepository.js';
import { EXERCISE_DICTIONARY } from '../data/exerciseDictionary.js';
import { EXERCISE_CATALOG, generateUUID, getFallbackExerciseUnit } from '../data/dummyGenerator.js';
import { normalizeMuscleLabel } from '../data/muscleGroups.js';
import type {
  AppUser,
  Exercise,
  Routine,
  Session,
  SessionExercise,
  SessionExerciseGroup,
  SetRecord,
  WorkoutLog,
} from '../types/workout.js';
import type { WorkoutStore } from './types.js';

const GROUP_COLOR_PALETTE = ['#7aa2f7', '#9ece6a', '#e0af68', '#f7768e'];
const DEMO_ROUTINE_NAMES = new Set([
  '퇴근 후 기초 홈트',
  '덤벨 볼륨 홈트',
  '짧고 진한 유지 루틴',
]);

type UnknownRecord = Record<string, unknown>;
type MigratableExercise = Partial<Exercise> & UnknownRecord;
type MigratableRoutine = Partial<Routine> & UnknownRecord;
type MigratableSession = Partial<Session> & UnknownRecord;
type MigratableSessionExercise = Partial<SessionExercise> & UnknownRecord;
type LegacyRoutineExercise = Partial<Omit<SessionExercise, 'session_id'>> & {
  routine_id?: string;
} & UnknownRecord;
type MigratableSessionExerciseGroup = Partial<SessionExerciseGroup> & UnknownRecord;
type MigratableWorkoutLog = Partial<WorkoutLog> & {
  routine_id?: string;
} & UnknownRecord;
type MigratableSetRecord = Partial<SetRecord> & {
  is_completed?: unknown;
} & UnknownRecord;

type MigratableWorkoutState = UnknownRecord & {
  currentUser?: Partial<AppUser>;
  exercises?: unknown;
  routines?: unknown;
  routineExercises?: unknown;
  sessions?: unknown;
  sessionExercises?: unknown;
  sessionExerciseGroups?: unknown;
  workoutLogs?: unknown;
  setRecords?: unknown;
  isDemoDataLoaded?: unknown;
  hasClearedDemoData?: unknown;
};

type NormalizableExercise = Parameters<typeof normalizeExerciseForApp>[0];

const catalogExercises = EXERCISE_CATALOG as unknown as MigratableExercise[];

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function arrayOfRecords<T extends UnknownRecord>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter(isRecord) as T[]) : [];
}

function toMigratableState(persistedState: unknown): MigratableWorkoutState {
  return isRecord(persistedState) ? { ...persistedState } : {};
}

function getExercises(state: MigratableWorkoutState): MigratableExercise[] {
  return Array.isArray(state.exercises)
    ? arrayOfRecords<MigratableExercise>(state.exercises)
    : catalogExercises;
}

function toNormalizableExercise(exercise: MigratableExercise): NormalizableExercise {
  return {
    ...exercise,
    id: typeof exercise.id === 'string' ? exercise.id : String(exercise.id ?? generateUUID()),
    name: typeof exercise.name === 'string' ? exercise.name : String(exercise.name ?? ''),
  } as NormalizableExercise;
}

function looksLikeBundledDemoData(state: MigratableWorkoutState) {
  const routines = arrayOfRecords<MigratableRoutine>(state.routines);
  const workoutLogs = arrayOfRecords<MigratableWorkoutLog>(state.workoutLogs);
  return (
    state.currentUser?.isGuest &&
    routines.length === DEMO_ROUTINE_NAMES.size &&
    routines.every((routine) => typeof routine.name === 'string' && DEMO_ROUTINE_NAMES.has(routine.name)) &&
    workoutLogs.length >= 30
  );
}

export function migrateWorkoutPersistState(persistedState: unknown, version: number): Partial<WorkoutStore> {
  let newState = toMigratableState(persistedState);

  if (version < 1) {
    const sessions = arrayOfRecords<MigratableRoutine>(newState.routines).map((routine) => ({
      id: routine.id,
      name: routine.name,
      user_id: routine.user_id,
      created_at: routine.created_at,
      updated_at: routine.updated_at,
    }));

    const sessionExercises = arrayOfRecords<LegacyRoutineExercise>(newState.routineExercises).map((routineExercise) => ({
      id: routineExercise.id,
      session_id: routineExercise.routine_id,
      exercise_id: routineExercise.exercise_id,
      order: routineExercise.order,
      target_sets: routineExercise.target_sets,
      target_record: routineExercise.target_record,
      created_at: routineExercise.created_at,
      updated_at: routineExercise.updated_at,
    }));

    const workoutLogs = arrayOfRecords<MigratableWorkoutLog>(newState.workoutLogs).map((log) => ({
      ...log,
      session_id: log.routine_id,
    }));

    delete newState.routines;
    delete newState.routineExercises;

    newState = {
      ...newState,
      sessions,
      sessionExercises,
      workoutLogs,
    };
  }

  if (version < 2) {
    const defaultRoutineId = generateUUID();
    const existingRoutines = arrayOfRecords<MigratableRoutine>(newState.routines);
    const sessionsForRoutine = arrayOfRecords<MigratableSession>(newState.sessions);
    const hasMigratedSessions = sessionsForRoutine.length > 0;
    const routines = existingRoutines.length > 0
      ? existingRoutines
      : hasMigratedSessions
        ? [{
            id: defaultRoutineId,
            name: '이전 루틴',
            user_id: newState.currentUser?.id || '00000000-0000-0000-0000-000000000000',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]
        : [];

    const sessions = sessionsForRoutine.map((session) => ({
      ...session,
      routine_id: session.routine_id || defaultRoutineId,
    }));

    newState = {
      ...newState,
      routines,
      sessions,
    };
  }

  if (version < 3) {
    newState = {
      ...newState,
      exercises: getExercises(newState).map((exercise) => ({
        ...exercise,
        primary_muscle: normalizeMuscleLabel(exercise.primary_muscle) || '기타',
      })),
    };
  }

  if (version < 4) {
    newState = {
      ...newState,
      exercises: getExercises(newState).map((exercise) => ({
        ...exercise,
        unit: exercise.unit || getFallbackExerciseUnit(String(exercise.name || '')),
      })),
    };
  }

  if (version < 5) {
    newState = {
      ...newState,
      exercises: getExercises(newState).map((exercise) => ({
        ...exercise,
        is_unilateral: exercise.is_unilateral !== undefined ? exercise.is_unilateral : false,
      })),
      setRecords: arrayOfRecords<MigratableSetRecord>(newState.setRecords).map((record) => {
        const rest = { ...record };
        delete rest.is_completed;
        return {
          ...rest,
          side: record.side || 'both',
        };
      }),
    };
  }

  if (version < 6) {
    newState = {
      ...newState,
      exercises: getExercises(newState).map((exercise) => {
        const exerciseName = String(exercise.name || '').toLowerCase();
        const dictEntry = EXERCISE_DICTIONARY.find((item) =>
          item.name.toLowerCase() === exerciseName ||
          (item.synonyms && item.synonyms.includes(exerciseName)),
        );
        return {
          ...exercise,
          is_unilateral: dictEntry ? (dictEntry.is_unilateral ?? false) : (exercise.is_unilateral ?? false),
        };
      }),
    };
  }

  if (version < 7) {
    const idMap = new Map<string, string>();
    const migratedExercises: Exercise[] = [];
    const seenExerciseIds = new Set<string>();

    getExercises(newState).forEach((exercise) => {
      const catalogExercise = CATALOG_EXERCISE_BY_NAME.get(String(exercise.name || '').toLowerCase());
      const exerciseForNormalization = catalogExercise
        ? ({
            ...exercise,
            id: catalogExercise.id,
            user_id: null,
          } as NormalizableExercise)
        : toNormalizableExercise(exercise);
      const nextExercise = normalizeExerciseForApp(exerciseForNormalization);

      if (catalogExercise && typeof exercise.id === 'string' && exercise.id !== catalogExercise.id) {
        idMap.set(exercise.id, catalogExercise.id);
      }

      if (!seenExerciseIds.has(nextExercise.id)) {
        migratedExercises.push(nextExercise);
        seenExerciseIds.add(nextExercise.id);
      }
    });

    newState = {
      ...newState,
      exercises: migratedExercises,
      sessionExercises: arrayOfRecords<MigratableSessionExercise>(newState.sessionExercises).map((item) => ({
        ...item,
        exercise_id: typeof item.exercise_id === 'string'
          ? idMap.get(item.exercise_id) || item.exercise_id
          : item.exercise_id,
      })),
      setRecords: arrayOfRecords<MigratableSetRecord>(newState.setRecords).map((item) => ({
        ...item,
        exercise_id: typeof item.exercise_id === 'string'
          ? idMap.get(item.exercise_id) || item.exercise_id
          : item.exercise_id,
      })),
    };
  }

  if (version < 8) {
    newState = {
      ...newState,
      sessionExerciseGroups: arrayOfRecords<MigratableSessionExerciseGroup>(newState.sessionExerciseGroups),
    };
  }

  if (version < 9) {
    const groupCountBySession = new Map<string | undefined, number>();
    newState = {
      ...newState,
      sessionExerciseGroups: arrayOfRecords<MigratableSessionExerciseGroup>(newState.sessionExerciseGroups).map((group) => {
        const count = groupCountBySession.get(group.session_id) || 0;
        groupCountBySession.set(group.session_id, count + 1);
        return {
          ...group,
          color: group.color || GROUP_COLOR_PALETTE[count % GROUP_COLOR_PALETTE.length],
        };
      }),
    };
  }

  if (version < 10) {
    newState = {
      ...newState,
      isDemoDataLoaded: Boolean(newState.isDemoDataLoaded || looksLikeBundledDemoData(newState)),
    };
  }

  if (version < 11) {
    newState = {
      ...newState,
      hasClearedDemoData: !(newState.isDemoDataLoaded || looksLikeBundledDemoData(newState)),
    };
    delete newState.isDemoDataLoaded;
  }

  return newState as Partial<WorkoutStore>;
}
