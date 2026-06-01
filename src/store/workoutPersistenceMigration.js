import { EXERCISE_DICTIONARY } from '../data/exerciseDictionary.js';
import { EXERCISE_CATALOG, generateUUID, getFallbackExerciseUnit } from '../data/dummyGenerator.js';
import { normalizeMuscleLabel } from '../data/muscleGroups.js';
import { CATALOG_EXERCISE_BY_NAME, normalizeExerciseForApp } from '../api/supabaseWorkoutRepository.js';

const GROUP_COLOR_PALETTE = ['#7aa2f7', '#9ece6a', '#e0af68', '#f7768e'];
const DEMO_ROUTINE_NAMES = new Set([
  '퇴근 후 기초 홈트',
  '덤벨 볼륨 홈트',
  '짧고 진한 유지 루틴',
]);

function looksLikeBundledDemoData(state) {
  const routines = state.routines || [];
  const workoutLogs = state.workoutLogs || [];
  return (
    state.currentUser?.isGuest &&
    routines.length === DEMO_ROUTINE_NAMES.size &&
    routines.every((routine) => DEMO_ROUTINE_NAMES.has(routine.name)) &&
    workoutLogs.length >= 30
  );
}

export function migrateWorkoutPersistState(persistedState, version) {
  let newState = { ...persistedState };

  if (version < 1) {
    const sessions = (newState.routines || []).map((routine) => ({
      id: routine.id,
      name: routine.name,
      user_id: routine.user_id,
      created_at: routine.created_at,
      updated_at: routine.updated_at,
    }));

    const sessionExercises = (newState.routineExercises || []).map((routineExercise) => ({
      id: routineExercise.id,
      session_id: routineExercise.routine_id,
      exercise_id: routineExercise.exercise_id,
      order: routineExercise.order,
      target_sets: routineExercise.target_sets,
      target_record: routineExercise.target_record,
      created_at: routineExercise.created_at,
      updated_at: routineExercise.updated_at,
    }));

    const workoutLogs = (newState.workoutLogs || []).map((log) => ({
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
    const hasMigratedSessions = (newState.sessions || []).length > 0;
    const routines = newState.routines && newState.routines.length > 0
      ? newState.routines
      : hasMigratedSessions
        ? [{
            id: defaultRoutineId,
            name: '이전 루틴',
            user_id: newState.currentUser?.id || '00000000-0000-0000-0000-000000000000',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]
        : [];

    const sessions = (newState.sessions || []).map((session) => ({
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
      exercises: (newState.exercises || EXERCISE_CATALOG).map((exercise) => ({
        ...exercise,
        primary_muscle: normalizeMuscleLabel(exercise.primary_muscle) || '기타',
      })),
    };
  }

  if (version < 4) {
    newState = {
      ...newState,
      exercises: (newState.exercises || EXERCISE_CATALOG).map((exercise) => ({
        ...exercise,
        unit: exercise.unit || getFallbackExerciseUnit(exercise.name),
      })),
    };
  }

  if (version < 5) {
    newState = {
      ...newState,
      exercises: (newState.exercises || EXERCISE_CATALOG).map((exercise) => ({
        ...exercise,
        is_unilateral: exercise.is_unilateral !== undefined ? exercise.is_unilateral : false,
      })),
      setRecords: (newState.setRecords || []).map((record) => {
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
      exercises: (newState.exercises || EXERCISE_CATALOG).map((exercise) => {
        const dictEntry = EXERCISE_DICTIONARY.find((item) =>
          item.name.toLowerCase() === exercise.name.toLowerCase() ||
          (item.synonyms && item.synonyms.includes(exercise.name.toLowerCase())),
        );
        return {
          ...exercise,
          is_unilateral: dictEntry ? (dictEntry.is_unilateral ?? false) : (exercise.is_unilateral ?? false),
        };
      }),
    };
  }

  if (version < 7) {
    const idMap = new Map();
    const migratedExercises = [];
    const seenExerciseIds = new Set();

    (newState.exercises || EXERCISE_CATALOG).forEach((exercise) => {
      const catalogExercise = CATALOG_EXERCISE_BY_NAME.get((exercise.name || '').toLowerCase());
      const nextExercise = normalizeExerciseForApp(catalogExercise ? {
        ...exercise,
        id: catalogExercise.id,
        user_id: null,
      } : exercise);

      if (catalogExercise && exercise.id !== catalogExercise.id) {
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
      sessionExercises: (newState.sessionExercises || []).map((item) => ({
        ...item,
        exercise_id: idMap.get(item.exercise_id) || item.exercise_id,
      })),
      setRecords: (newState.setRecords || []).map((item) => ({
        ...item,
        exercise_id: idMap.get(item.exercise_id) || item.exercise_id,
      })),
    };
  }

  if (version < 8) {
    newState = {
      ...newState,
      sessionExerciseGroups: newState.sessionExerciseGroups || [],
    };
  }

  if (version < 9) {
    const groupCountBySession = new Map();
    newState = {
      ...newState,
      sessionExerciseGroups: (newState.sessionExerciseGroups || []).map((group) => {
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

  return newState;
}
