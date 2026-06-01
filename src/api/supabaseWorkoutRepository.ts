import { EXERCISE_CATALOG, getFallbackExerciseUnit } from '../data/dummyGenerator.js';
import { normalizeMuscleLabel } from '../data/muscleGroups.js';
import type {
  Exercise,
  ExerciseCategory,
  ExerciseUnit,
  Id,
  Routine,
  Session,
  SessionExercise,
  SessionExerciseGroup,
  SetRecord,
  Timestamp,
  WorkoutLog,
} from '../types/workout.js';
import { supabase } from '../utils/supabaseClient.js';

const CATALOG_EXERCISE_ID_SET = new Set(EXERCISE_CATALOG.map((exercise) => exercise.id));

const EXERCISE_CATEGORIES = new Set<ExerciseCategory>([
  'strength',
  'stretching',
  'cardio',
  'plyometrics',
  'powerlifting',
]);
const EXERCISE_UNITS = new Set<ExerciseUnit>(['kg', 'reps', 'sec']);

type Nullable<T> = T | null | undefined;

type RawExercise = {
  id: Id;
  name: string;
  englishName?: Nullable<string>;
  english_name?: Nullable<string>;
  primary_muscle?: Nullable<string>;
  primaryMuscle?: Nullable<string>;
  secondaryMuscles?: Nullable<string[]>;
  secondary_muscles?: Nullable<string[]>;
  equipment?: Nullable<string>;
  category?: Nullable<string>;
  unit?: Nullable<string>;
  is_unilateral?: Nullable<boolean>;
  synonyms?: Nullable<string[]>;
  user_id?: Nullable<Id>;
  created_at?: Timestamp;
  updated_at?: Timestamp;
};

type ExerciseUpdateInput = Partial<Omit<RawExercise, 'id'>>;

type SupabaseExerciseRow = {
  id: Id;
  name: string;
  english_name: string | null;
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: string;
  category: ExerciseCategory;
  unit: ExerciseUnit;
  is_unilateral: boolean;
  synonyms: string[];
  user_id: Id;
  created_at: Timestamp;
  updated_at: Timestamp;
};

type SupabaseExerciseUpdate = Partial<Omit<SupabaseExerciseRow, 'id' | 'user_id' | 'created_at'>> & {
  updated_at: Timestamp;
};

type SupabaseErrorLike = {
  code?: string;
};

type SupabaseResult = {
  error: unknown;
};

type WorkoutTableRows = {
  exercises: SupabaseExerciseRow | RawExercise;
  routines: Routine;
  sessions: Session;
  session_exercises: SessionExercise;
  session_exercise_groups: SessionExerciseGroup;
  workout_logs: WorkoutLog;
  set_records: SetRecord;
};

type WorkoutTable = keyof WorkoutTableRows;
type WorkoutRow = WorkoutTableRows[WorkoutTable];

type UserWorkoutData = {
  exercises: Exercise[];
  routines: Routine[];
  sessions: Session[];
  sessionExercises: SessionExercise[];
  sessionExerciseGroups: SessionExerciseGroup[];
  workoutLogs: WorkoutLog[];
  setRecords: SetRecord[];
};

type MigrationData = {
  authUserId: Id;
  exercises: RawExercise[];
  routines: Routine[];
  sessions: Session[];
  sessionExercises: SessionExercise[];
  sessionExerciseGroups?: SessionExerciseGroup[];
  workoutLogs: WorkoutLog[];
  setRecords: SetRecord[];
};

type SeedData = {
  exercises: RawExercise[];
  routines: Routine[];
  sessions: Session[];
  sessionExercises: SessionExercise[];
  sessionExerciseGroups?: SessionExerciseGroup[];
  workoutLogs: WorkoutLog[];
  setRecords: SetRecord[];
};

const toExerciseCategory = (category: Nullable<string>): ExerciseCategory => {
  if (category && EXERCISE_CATEGORIES.has(category as ExerciseCategory)) {
    return category as ExerciseCategory;
  }
  return 'strength';
};

const toExerciseUnit = (name: string, unit: Nullable<string>): ExerciseUnit => {
  if (unit && EXERCISE_UNITS.has(unit as ExerciseUnit)) {
    return unit as ExerciseUnit;
  }
  return getFallbackExerciseUnit(name) as ExerciseUnit;
};

const asRows = <T>(data: T[] | null | undefined): T[] => data || [];

export const CATALOG_EXERCISE_BY_NAME = new Map(
  EXERCISE_CATALOG.map((exercise) => [exercise.name.toLowerCase(), exercise]),
);

export function normalizeExerciseForApp(exercise: RawExercise): Exercise {
  const secondaryMuscles = exercise.secondaryMuscles ?? exercise.secondary_muscles ?? [];
  const englishName = exercise.englishName ?? exercise.english_name ?? null;

  return {
    id: exercise.id,
    name: exercise.name,
    englishName,
    english_name: englishName,
    secondaryMuscles,
    secondary_muscles: secondaryMuscles,
    primary_muscle: normalizeMuscleLabel(exercise.primary_muscle ?? exercise.primaryMuscle) || '기타',
    equipment: exercise.equipment || '기타',
    category: toExerciseCategory(exercise.category),
    unit: toExerciseUnit(exercise.name, exercise.unit),
    is_unilateral: exercise.is_unilateral ?? false,
    synonyms: exercise.synonyms || [],
    user_id: exercise.user_id,
    created_at: exercise.created_at,
    updated_at: exercise.updated_at,
  };
}

function exerciseForSupabase(exercise: RawExercise, userId: Id): SupabaseExerciseRow {
  const normalized = normalizeExerciseForApp(exercise);
  return {
    id: normalized.id,
    name: normalized.name,
    english_name: normalized.englishName ?? null,
    primary_muscle: normalized.primary_muscle,
    secondary_muscles: normalized.secondaryMuscles,
    equipment: normalized.equipment,
    category: normalized.category,
    unit: normalized.unit,
    is_unilateral: normalized.is_unilateral,
    synonyms: normalized.synonyms,
    user_id: userId,
    created_at: normalized.created_at || new Date().toISOString(),
    updated_at: normalized.updated_at || new Date().toISOString(),
  };
}

function exerciseUpdatesForSupabase(updates: ExerciseUpdateInput, updatedAt: Timestamp): SupabaseExerciseUpdate {
  const dbUpdates: SupabaseExerciseUpdate = { updated_at: updatedAt };
  if (typeof updates.name === 'string') dbUpdates.name = updates.name;
  if ('englishName' in updates || 'english_name' in updates) {
    dbUpdates.english_name = updates.englishName ?? updates.english_name ?? null;
  }
  if ('primary_muscle' in updates || 'primaryMuscle' in updates) {
    dbUpdates.primary_muscle = normalizeMuscleLabel(updates.primary_muscle ?? updates.primaryMuscle) || '기타';
  }
  if ('secondaryMuscles' in updates || 'secondary_muscles' in updates) {
    dbUpdates.secondary_muscles = updates.secondaryMuscles ?? updates.secondary_muscles ?? [];
  }
  if ('equipment' in updates) dbUpdates.equipment = updates.equipment ?? '기타';
  if ('category' in updates) dbUpdates.category = toExerciseCategory(updates.category);
  if ('unit' in updates) dbUpdates.unit = toExerciseUnit(updates.name ?? '', updates.unit);
  if ('is_unilateral' in updates) dbUpdates.is_unilateral = updates.is_unilateral ?? false;
  if ('synonyms' in updates) dbUpdates.synonyms = updates.synonyms || [];
  return dbUpdates;
}

function mergeCatalogAndServerExercises(serverExercises: RawExercise[] = []): Exercise[] {
  const byName = new Map(EXERCISE_CATALOG.map((exercise) => [
    exercise.name.toLowerCase(),
    normalizeExerciseForApp(exercise),
  ]));

  serverExercises.forEach((exercise) => {
    byName.set(exercise.name.toLowerCase(), normalizeExerciseForApp(exercise));
  });

  return [...byName.values()];
}

function uniqueById<T extends { id?: Nullable<Id> }>(items: Array<T | null | undefined>): T[] {
  const seen = new Set<Id>();
  return items.filter((item): item is T => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function throwIfSupabaseError<T extends SupabaseResult>(result: T): T {
  if (result.error) throw result.error;
  return result;
}

export function isPublicMasterExercise(exercise: { user_id?: Nullable<Id>; id?: Nullable<Id> } | null | undefined): boolean {
  return exercise?.user_id === null || Boolean(exercise?.id && CATALOG_EXERCISE_ID_SET.has(exercise.id));
}

export async function fetchPublicExerciseCatalog(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .is('user_id', null)
    .order('name', { ascending: true });

  if (error) throw error;
  return mergeCatalogAndServerExercises(asRows<RawExercise>(data));
}

export async function fetchUserWorkoutData(userId: Id): Promise<UserWorkoutData> {
  const { data: serverExercises, error: exError } = await supabase
    .from('exercises')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`);
  if (exError) throw exError;

  const sortedServerExercises = [
    ...(serverExercises || []).filter((exercise) => exercise.user_id === null),
    ...(serverExercises || []).filter((exercise) => exercise.user_id === userId),
  ];

  const { data: serverRoutines, error: rtError } = await supabase
    .from('routines')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (rtError) throw rtError;

  const { data: serverSessions, error: ssError } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('session_order', { ascending: true });
  if (ssError) throw ssError;

  const sessionIds = (serverSessions || []).map((session) => session.id);
  const sessionExerciseResult = sessionIds.length > 0
    ? await supabase.from('session_exercises').select('*').in('session_id', sessionIds)
    : { data: [], error: null };
  if (sessionExerciseResult.error) throw sessionExerciseResult.error;

  const sessionExerciseGroupResult = sessionIds.length > 0
    ? await supabase.from('session_exercise_groups').select('*').in('session_id', sessionIds)
    : { data: [], error: null };
  // PGRST205: table not yet created in DB — treat as empty until migration runs
  if (
    sessionExerciseGroupResult.error &&
    (sessionExerciseGroupResult.error as SupabaseErrorLike).code !== 'PGRST205'
  ) {
    throw sessionExerciseGroupResult.error;
  }

  const { data: serverLogs, error: wlError } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('user_id', userId)
    .order('start_time', { ascending: false });
  if (wlError) throw wlError;

  const logIds = (serverLogs || []).map((log) => log.id);
  const setRecordResult = logIds.length > 0
    ? await supabase.from('set_records').select('*').in('workout_log_id', logIds)
    : { data: [], error: null };
  if (setRecordResult.error) throw setRecordResult.error;

  return {
    exercises: mergeCatalogAndServerExercises(sortedServerExercises as RawExercise[]),
    routines: asRows<Routine>(serverRoutines),
    sessions: asRows<Session>(serverSessions),
    sessionExercises: asRows<SessionExercise>(sessionExerciseResult.data),
    sessionExerciseGroups: asRows<SessionExerciseGroup>(sessionExerciseGroupResult.data),
    workoutLogs: asRows<WorkoutLog>(serverLogs),
    setRecords: asRows<SetRecord>(setRecordResult.data),
  };
}

export async function syncExercisesForReferences({
  exercises,
  exerciseIds,
  userId,
}: {
  exercises: RawExercise[];
  exerciseIds: Array<Nullable<Id>>;
  userId?: Nullable<Id>;
}): Promise<void> {
  if (!userId) return;

  const ids = [...new Set(exerciseIds.filter((id): id is Id => Boolean(id)))];
  if (ids.length === 0) return;

  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const rows = uniqueById(ids.map((id) => exercisesById.get(id)))
    .filter((exercise) => !isPublicMasterExercise(exercise))
    .map((exercise) => exerciseForSupabase(exercise, userId));

  if (rows.length === 0) return;
  throwIfSupabaseError(await supabase.from('exercises').upsert(rows));
}

export async function insertExercise(exercise: RawExercise, userId: Id): Promise<void> {
  throwIfSupabaseError(await supabase.from('exercises').upsert(exerciseForSupabase(exercise, userId)));
}

export async function updateExercise(id: Id, updates: ExerciseUpdateInput, updatedAt: Timestamp): Promise<void> {
  throwIfSupabaseError(
    await supabase.from('exercises').update(exerciseUpdatesForSupabase(updates, updatedAt)).eq('id', id),
  );
}

export async function insertRows<T extends WorkoutTable>(table: T, rows: WorkoutTableRows[T][]): Promise<void> {
  if (!rows || rows.length === 0) return;
  throwIfSupabaseError(await supabase.from(table).insert(rows));
}

export async function insertRow<T extends WorkoutTable>(table: T, row: WorkoutTableRows[T]): Promise<void> {
  throwIfSupabaseError(await supabase.from(table).insert(row));
}

export async function updateRow<T extends WorkoutTable>(
  table: T,
  id: Id,
  updates: Partial<WorkoutTableRows[T]>,
): Promise<void> {
  throwIfSupabaseError(await supabase.from(table).update(updates as unknown as WorkoutRow).eq('id', id));
}

export async function deleteRow(table: WorkoutTable, id: Id): Promise<void> {
  throwIfSupabaseError(await supabase.from(table).delete().eq('id', id));
}

export async function upsertRows<T extends WorkoutTable>(table: T, rows: WorkoutTableRows[T][]): Promise<void> {
  if (!rows || rows.length === 0) return;
  throwIfSupabaseError(await supabase.from(table).upsert(rows));
}

export async function deleteUserRows(table: WorkoutTable, userId: Id): Promise<void> {
  throwIfSupabaseError(await supabase.from(table).delete().eq('user_id', userId));
}

export async function migrateLocalDataToSupabase({
  authUserId,
  exercises,
  routines,
  sessions,
  sessionExercises,
  sessionExerciseGroups = [],
  workoutLogs,
  setRecords,
}: MigrationData): Promise<void> {
  const customExercises = uniqueById(exercises).filter((exercise) => !isPublicMasterExercise(exercise));
  if (customExercises.length > 0) {
    await upsertRows('exercises', customExercises.map((exercise) => exerciseForSupabase(exercise, authUserId)));
  }

  await insertRows('routines', routines.map((routine) => ({ ...routine, user_id: authUserId })));
  await insertRows('sessions', sessions.map((session) => ({ ...session, user_id: authUserId })));
  await insertRows('session_exercises', sessionExercises);
  await insertRows('session_exercise_groups', sessionExerciseGroups);
  await insertRows('workout_logs', workoutLogs.map((log) => ({ ...log, user_id: authUserId })));
  await insertRows('set_records', setRecords);
}

export async function clearUserWorkoutData(userId: Id): Promise<void> {
  await deleteUserRows('routines', userId);
  await deleteUserRows('workout_logs', userId);
}

export async function replaceUserWorkoutDataWithSeed(seedData: SeedData, userId: Id): Promise<void> {
  await clearUserWorkoutData(userId);

  const customExercises = uniqueById(seedData.exercises).filter((exercise) => !isPublicMasterExercise(exercise));
  if (customExercises.length > 0) {
    await upsertRows('exercises', customExercises.map((exercise) => exerciseForSupabase(exercise, userId)));
  }

  await insertRows('routines', seedData.routines);
  await insertRows('sessions', seedData.sessions);
  await insertRows('session_exercises', seedData.sessionExercises);
  await insertRows('session_exercise_groups', seedData.sessionExerciseGroups || []);
  await insertRows('workout_logs', seedData.workoutLogs);
  await insertRows('set_records', seedData.setRecords);
}
