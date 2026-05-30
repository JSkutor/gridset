import { DEFAULT_EXERCISES, getDefaultExerciseUnit } from '../data/dummyGenerator.js';
import { normalizeMuscleLabel } from '../data/muscleGroups.js';
import { supabase } from '../utils/supabaseClient.js';

const DEFAULT_EXERCISE_ID_SET = new Set(DEFAULT_EXERCISES.map((exercise) => exercise.id));

export const DEFAULT_EXERCISE_BY_NAME = new Map(
  DEFAULT_EXERCISES.map((exercise) => [exercise.name.toLowerCase(), exercise]),
);

export function normalizeExerciseForApp(exercise) {
  return {
    ...exercise,
    englishName: exercise.englishName ?? exercise.english_name ?? null,
    secondaryMuscles: exercise.secondaryMuscles ?? exercise.secondary_muscles ?? [],
    primary_muscle: normalizeMuscleLabel(exercise.primary_muscle ?? exercise.primaryMuscle) || '기타',
    equipment: exercise.equipment || '기타',
    category: exercise.category || 'strength',
    unit: exercise.unit || getDefaultExerciseUnit(exercise.name),
    is_unilateral: exercise.is_unilateral ?? false,
    synonyms: exercise.synonyms || [],
  };
}

function exerciseForSupabase(exercise, userId) {
  const normalized = normalizeExerciseForApp(exercise);
  return {
    id: normalized.id,
    name: normalized.name,
    english_name: normalized.englishName,
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

function exerciseUpdatesForSupabase(updates, updatedAt) {
  const dbUpdates = { updated_at: updatedAt };
  if ('name' in updates) dbUpdates.name = updates.name;
  if ('englishName' in updates || 'english_name' in updates) {
    dbUpdates.english_name = updates.englishName ?? updates.english_name ?? null;
  }
  if ('primary_muscle' in updates || 'primaryMuscle' in updates) {
    dbUpdates.primary_muscle = normalizeMuscleLabel(updates.primary_muscle ?? updates.primaryMuscle) || '기타';
  }
  if ('secondaryMuscles' in updates || 'secondary_muscles' in updates) {
    dbUpdates.secondary_muscles = updates.secondaryMuscles ?? updates.secondary_muscles ?? [];
  }
  if ('equipment' in updates) dbUpdates.equipment = updates.equipment;
  if ('category' in updates) dbUpdates.category = updates.category;
  if ('unit' in updates) dbUpdates.unit = updates.unit;
  if ('is_unilateral' in updates) dbUpdates.is_unilateral = updates.is_unilateral;
  if ('synonyms' in updates) dbUpdates.synonyms = updates.synonyms || [];
  return dbUpdates;
}

function mergeDefaultAndServerExercises(serverExercises = []) {
  const byName = new Map(DEFAULT_EXERCISES.map((exercise) => [
    exercise.name.toLowerCase(),
    normalizeExerciseForApp(exercise),
  ]));

  serverExercises.forEach((exercise) => {
    byName.set(exercise.name.toLowerCase(), normalizeExerciseForApp(exercise));
  });

  return [...byName.values()];
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function throwIfSupabaseError(result) {
  if (result.error) throw result.error;
  return result;
}

export function isPublicMasterExercise(exercise) {
  return exercise?.user_id === null || DEFAULT_EXERCISE_ID_SET.has(exercise?.id);
}

export async function fetchPublicExerciseCatalog() {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .is('user_id', null)
    .order('name', { ascending: true });

  if (error) throw error;
  return mergeDefaultAndServerExercises(data || []);
}

export async function fetchUserWorkoutData(userId) {
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
  if (sessionExerciseGroupResult.error) throw sessionExerciseGroupResult.error;

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
    exercises: mergeDefaultAndServerExercises(sortedServerExercises),
    routines: serverRoutines || [],
    sessions: serverSessions || [],
    sessionExercises: sessionExerciseResult.data || [],
    sessionExerciseGroups: sessionExerciseGroupResult.data || [],
    workoutLogs: serverLogs || [],
    setRecords: setRecordResult.data || [],
  };
}

export async function syncExercisesForReferences({ exercises, exerciseIds, userId }) {
  if (!userId) return;

  const ids = [...new Set(exerciseIds.filter(Boolean))];
  if (ids.length === 0) return;

  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const rows = uniqueById(ids.map((id) => exercisesById.get(id)))
    .filter((exercise) => !isPublicMasterExercise(exercise))
    .map((exercise) => exerciseForSupabase(exercise, userId));

  if (rows.length === 0) return;
  throwIfSupabaseError(await supabase.from('exercises').upsert(rows));
}

export async function insertExercise(exercise, userId) {
  throwIfSupabaseError(await supabase.from('exercises').upsert(exerciseForSupabase(exercise, userId)));
}

export async function updateExercise(id, updates, updatedAt) {
  throwIfSupabaseError(
    await supabase.from('exercises').update(exerciseUpdatesForSupabase(updates, updatedAt)).eq('id', id),
  );
}

export async function insertRows(table, rows) {
  if (!rows || rows.length === 0) return;
  throwIfSupabaseError(await supabase.from(table).insert(rows));
}

export async function insertRow(table, row) {
  throwIfSupabaseError(await supabase.from(table).insert(row));
}

export async function updateRow(table, id, updates) {
  throwIfSupabaseError(await supabase.from(table).update(updates).eq('id', id));
}

export async function deleteRow(table, id) {
  throwIfSupabaseError(await supabase.from(table).delete().eq('id', id));
}

export async function upsertRows(table, rows) {
  if (!rows || rows.length === 0) return;
  throwIfSupabaseError(await supabase.from(table).upsert(rows));
}

export async function deleteUserRows(table, userId) {
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
}) {
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

export async function clearUserWorkoutData(userId) {
  await deleteUserRows('routines', userId);
  await deleteUserRows('workout_logs', userId);
}

export async function replaceUserWorkoutDataWithSeed(seedData, userId) {
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
