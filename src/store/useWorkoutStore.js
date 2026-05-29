import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EXERCISE_DICTIONARY } from '../data/exerciseDictionary.js';
import { normalizeMuscleLabel } from '../data/muscleGroups.js';
import { MAX_SESSIONS_PER_ROUTINE } from '../utils/sessionHelper.js';
import { DEFAULT_EXERCISES, createDummyWorkoutData, generateUUID, getDefaultExerciseUnit } from '../data/dummyGenerator.js';
import { supabase } from '../utils/supabaseClient.js';

const GUEST_USER = { id: '00000000-0000-0000-0000-000000000000', name: '게스트', isGuest: true };
const DEFAULT_EXERCISE_BY_NAME = new Map(DEFAULT_EXERCISES.map(exercise => [exercise.name.toLowerCase(), exercise]));
const DEFAULT_EXERCISE_ID_SET = new Set(DEFAULT_EXERCISES.map(exercise => exercise.id));

const normalizeExerciseForApp = (exercise) => ({
  ...exercise,
  englishName: exercise.englishName ?? exercise.english_name ?? null,
  secondaryMuscles: exercise.secondaryMuscles ?? exercise.secondary_muscles ?? [],
  primary_muscle: normalizeMuscleLabel(exercise.primary_muscle ?? exercise.primaryMuscle) || '기타',
  equipment: exercise.equipment || '기타',
  category: exercise.category || 'strength',
  unit: exercise.unit || getDefaultExerciseUnit(exercise.name),
  is_unilateral: exercise.is_unilateral ?? false,
  synonyms: exercise.synonyms || [],
});

const exerciseForSupabase = (exercise, userId) => {
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
};

const exerciseUpdatesForSupabase = (updates, updatedAt) => {
  const dbUpdates = { updated_at: updatedAt };
  if ('name' in updates) dbUpdates.name = updates.name;
  if ('englishName' in updates || 'english_name' in updates) dbUpdates.english_name = updates.englishName ?? updates.english_name ?? null;
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
};

const mergeDefaultAndServerExercises = (serverExercises = []) => {
  const byName = new Map(DEFAULT_EXERCISES.map(exercise => [
    exercise.name.toLowerCase(),
    normalizeExerciseForApp(exercise),
  ]));

  serverExercises.forEach((exercise) => {
    byName.set(exercise.name.toLowerCase(), normalizeExerciseForApp(exercise));
  });

  return [...byName.values()];
};

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const throwIfSupabaseError = (result) => {
  if (result.error) throw result.error;
  return result;
};

const isPublicMasterExercise = (exercise) => (
  exercise?.user_id === null || DEFAULT_EXERCISE_ID_SET.has(exercise?.id)
);

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      // --- State ---
      currentUser: GUEST_USER, 
      exercises: DEFAULT_EXERCISES,
      routines: [],
      sessions: [],
      sessionExercises: [],
      workoutLogs: [],
      setRecords: [],
      
      // Supabase specific states
      isSyncing: false,
      authSession: null,

      // --- Supabase Actions ---
      fetchPublicExercises: async () => {
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .is('user_id', null)
          .order('name', { ascending: true });

        if (error) {
          console.error('Failed to fetch public exercises from Supabase:', error);
          return;
        }

        set({ exercises: mergeDefaultAndServerExercises(data || []) });
      },

      syncExercisesForReferences: async (exerciseIds, userId) => {
        if (!userId || userId === GUEST_USER.id) return;

        const ids = [...new Set(exerciseIds.filter(Boolean))];
        if (ids.length === 0) return;

        const exercisesById = new Map(get().exercises.map(exercise => [exercise.id, exercise]));
        const rows = uniqueById(ids.map(id => exercisesById.get(id)))
          .filter(exercise => !isPublicMasterExercise(exercise))
          .map(exercise => exerciseForSupabase(exercise, userId));

        if (rows.length === 0) return;

        const { error } = await supabase.from('exercises').upsert(rows);
        if (error) throw error;
      },

      setAuthSession: async (session) => {
        const previousUser = get().currentUser;
        
        if (session) {
          const user = session.user;
          const currentUser = {
            id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || '회원',
            email: user.email,
            isGuest: false
          };
          
          set({ authSession: session, currentUser });
          
          // If we transitioned from Guest to Logged-in, and have local data, migrate it!
          const hasLocalData = get().routines.length > 0 || get().workoutLogs.length > 0;
          if (previousUser.isGuest && hasLocalData) {
            console.log('Transitioning Guest -> Logged-in. Migrating local data...');
            await get().migrateLocalDataToSupabase(user.id);
          }
          
          // Hydrate data from server
          await get().fetchUserData();
        } else {
          // Clear session and reset to guest defaults
          set({
            authSession: null,
            currentUser: GUEST_USER,
            exercises: DEFAULT_EXERCISES,
            routines: [],
            sessions: [],
            sessionExercises: [],
            workoutLogs: [],
            setRecords: []
          });
          await get().fetchPublicExercises();
        }
      },

      fetchUserData: async () => {
        const { currentUser, isSyncing } = get();
        if (currentUser.isGuest) return;
        if (isSyncing) return;
        
        set({ isSyncing: true });
        try {
          const userId = currentUser.id;
          
          // 1. Fetch public exercises plus user-owned synced/custom exercises.
          const { data: serverExercises, error: exError } = await supabase
            .from('exercises')
            .select('*')
            .or(`user_id.is.null,user_id.eq.${userId}`);
          if (exError) throw exError;

          // Merge defaults with server rows by name so user-owned rows override public/default rows.
          const sortedServerExercises = [
            ...(serverExercises || []).filter(exercise => exercise.user_id === null),
            ...(serverExercises || []).filter(exercise => exercise.user_id === userId),
          ];
          const mergedExercises = mergeDefaultAndServerExercises(sortedServerExercises);

          // 2. Fetch routines
          const { data: serverRoutines, error: rtError } = await supabase
            .from('routines')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });
          if (rtError) throw rtError;

          // 3. Fetch sessions
          const { data: serverSessions, error: ssError } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', userId)
            .order('session_order', { ascending: true });
          if (ssError) throw ssError;

          // 4. Fetch session_exercises
          const { data: serverSessionExercises, error: seError } = await supabase
            .from('session_exercises')
            .select('*');
          if (seError) throw seError;

          // 5. Fetch workout logs
          const { data: serverLogs, error: wlError } = await supabase
            .from('workout_logs')
            .select('*')
            .eq('user_id', userId)
            .order('start_time', { ascending: false });
          if (wlError) throw wlError;

          // 6. Fetch set records
          const { data: serverRecords, error: srError } = await supabase
            .from('set_records')
            .select('*');
          if (srError) throw srError;

          set({
            exercises: mergedExercises,
            routines: serverRoutines || [],
            sessions: serverSessions || [],
            sessionExercises: serverSessionExercises || [],
            workoutLogs: serverLogs || [],
            setRecords: serverRecords || [],
          });
        } catch (error) {
          console.error('Failed to fetch user data from Supabase:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      migrateLocalDataToSupabase: async (authUserId) => {
        const { exercises, routines, sessions, sessionExercises, workoutLogs, setRecords } = get();
        
        try {
          set({ isSyncing: true });
          
          // 1. Bulk upsert exercises first so FK references in templates/logs are valid.
          const customExercises = uniqueById(exercises).filter(exercise => !isPublicMasterExercise(exercise));
          if (customExercises.length > 0) {
            const mappedExercises = customExercises.map(ex => exerciseForSupabase(ex, authUserId));
            const { error } = await supabase.from('exercises').upsert(mappedExercises);
            if (error) throw error;
          }

          // 2. Bulk insert routines
          if (routines.length > 0) {
            const mappedRoutines = routines.map(r => ({
              ...r,
              user_id: authUserId
            }));
            const { error } = await supabase.from('routines').insert(mappedRoutines);
            if (error) console.error('Migration Error (routines):', error);
          }

          // 3. Bulk insert sessions
          if (sessions.length > 0) {
            const mappedSessions = sessions.map(s => ({
              ...s,
              user_id: authUserId
            }));
            const { error } = await supabase.from('sessions').insert(mappedSessions);
            if (error) console.error('Migration Error (sessions):', error);
          }

          // 4. Bulk insert session exercises
          if (sessionExercises.length > 0) {
            const { error } = await supabase.from('session_exercises').insert(sessionExercises);
            if (error) console.error('Migration Error (session_exercises):', error);
          }

          // 5. Bulk insert workout logs
          if (workoutLogs.length > 0) {
            const mappedLogs = workoutLogs.map(log => ({
              ...log,
              user_id: authUserId
            }));
            const { error } = await supabase.from('workout_logs').insert(mappedLogs);
            if (error) console.error('Migration Error (workout_logs):', error);
          }

          // 6. Bulk insert set records
          if (setRecords.length > 0) {
            const { error } = await supabase.from('set_records').insert(setRecords);
            if (error) console.error('Migration Error (set_records):', error);
          }

          console.log('Successfully migrated guest data to Supabase!');
        } catch (err) {
          console.error('Migration failed:', err);
        } finally {
          set({ isSyncing: false });
        }
      },

      // --- Actions: Exercises ---
      addExercise: (name, primary_muscle = null, equipment = null, unit = 'kg', is_unilateral = false) => {
        const { currentUser, exercises } = get();
        
        // 중복 방지
        const existing = exercises.find(ex => ex.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing;

        // 로컬 사전에 주동근/장비가 정의되어 있다면 가져옴
        let muscle = primary_muscle;
        let equip = equipment;
        let isUnilateral = is_unilateral;
        if (!muscle || !equip || !is_unilateral) {
          const dictEntry = EXERCISE_DICTIONARY.find(ex => 
            ex.name.toLowerCase() === name.toLowerCase() || 
            (ex.synonyms && ex.synonyms.includes(name.toLowerCase()))
          );
          if (dictEntry) {
            muscle = muscle || dictEntry.primaryMuscle;
            equip = equip || dictEntry.equipment;
            isUnilateral = is_unilateral || dictEntry.is_unilateral || false;
          }
        }

        const newExercise = {
          id: generateUUID(),
          name,
          primary_muscle: normalizeMuscleLabel(muscle) || '기타',
          equipment: equip || '기타',
          unit,
          is_unilateral: isUnilateral,
          user_id: currentUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        set((state) => ({ exercises: [...state.exercises, newExercise] }));

        if (!currentUser.isGuest) {
          const remoteExercise = exerciseForSupabase(newExercise, currentUser.id);
          supabase.from('exercises').insert(remoteExercise).then(({ error }) => {
            if (error) console.error('Failed to sync addExercise:', error);
          });
        }

        return newExercise;
      },
      deleteExercise: (id) => {
        const { currentUser } = get();
        set((state) => ({ exercises: state.exercises.filter(ex => ex.id !== id) }));
        
        if (!currentUser.isGuest) {
          supabase.from('exercises').delete().eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to sync deleteExercise:', error);
          });
        }
      },
      updateExercise: (id, updates) => {
        const { currentUser } = get();
        const updatedAt = new Date().toISOString();
        
        set((state) => ({
          exercises: state.exercises.map(ex =>
            ex.id === id ? { ...ex, ...updates, updated_at: updatedAt } : ex
          )
        }));

        if (!currentUser.isGuest) {
          supabase.from('exercises').update(exerciseUpdatesForSupabase(updates, updatedAt)).eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to sync updateExercise:', error);
          });
        }
      },

      // --- Actions: Routines ---
      addRoutine: (name) => {
        const { currentUser } = get();
        const newRoutine = {
          id: generateUUID(),
          name,
          user_id: currentUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        set((state) => ({ routines: [...state.routines, newRoutine] }));

        if (!currentUser.isGuest) {
          supabase.from('routines').insert(newRoutine).then(({ error }) => {
            if (error) console.error('Failed to sync addRoutine:', error);
          });
        }

        return newRoutine;
      },
      deleteRoutine: (id) => {
        const { currentUser, sessions } = get();
        const sessionsToDelete = sessions.filter(s => s.routine_id === id);
        const sessionIdsToDelete = sessionsToDelete.map(s => s.id);
        
        set((state) => ({
          routines: state.routines.filter(r => r.id !== id),
          sessions: state.sessions.filter(s => s.routine_id !== id),
          sessionExercises: state.sessionExercises.filter(se => !sessionIdsToDelete.includes(se.session_id))
        }));

        if (!currentUser.isGuest) {
          supabase.from('routines').delete().eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to sync deleteRoutine:', error);
          });
        }
      },
      updateRoutine: (id, name) => {
        const { currentUser } = get();
        const updatedAt = new Date().toISOString();
        
        set((state) => ({
          routines: state.routines.map(r => r.id === id ? { ...r, name, updated_at: updatedAt } : r)
        }));

        if (!currentUser.isGuest) {
          supabase.from('routines').update({ name, updated_at: updatedAt }).eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to sync updateRoutine:', error);
          });
        }
      },
      duplicateRoutine: (sourceRoutineId) => {
        const { currentUser, routines, sessions, sessionExercises } = get();
        const sourceRoutine = routines.find(r => r.id === sourceRoutineId);
        if (!sourceRoutine) return null;

        const newRoutineId = generateUUID();
        const newRoutine = {
          id: newRoutineId,
          name: `${sourceRoutine.name} 복사`,
          user_id: currentUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const sessionsToCopy = sessions.filter(s => s.routine_id === sourceRoutineId);
        const newSessions = [];
        const newSessionExercises = [];

        sessionsToCopy.forEach(s => {
          const newSessionId = generateUUID();
          newSessions.push({
            id: newSessionId,
            name: s.name,
            routine_id: newRoutineId,
            session_order: s.session_order,
            user_id: currentUser.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          const exercisesToCopy = sessionExercises.filter(se => se.session_id === s.id);
          exercisesToCopy.forEach(se => {
            newSessionExercises.push({
              id: generateUUID(),
              session_id: newSessionId,
              exercise_id: se.exercise_id,
              order: se.order,
              target_sets: se.target_sets,
              target_record: se.target_record,
              rest_between_sets: se.rest_between_sets,
              rest_after_exercise: se.rest_after_exercise,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          });
        });

        set((state) => ({
          routines: [...state.routines, newRoutine],
          sessions: [...state.sessions, ...newSessions],
          sessionExercises: [...state.sessionExercises, ...newSessionExercises]
        }));

        if (!currentUser.isGuest) {
          Promise.resolve()
            .then(() => get().syncExercisesForReferences(newSessionExercises.map(se => se.exercise_id), currentUser.id))
            .then(async () => {
              const routineResult = await supabase.from('routines').insert(newRoutine);
              if (routineResult.error) throw routineResult.error;

              if (newSessions.length > 0) {
                const sessionsResult = await supabase.from('sessions').insert(newSessions);
                if (sessionsResult.error) throw sessionsResult.error;
              }

              if (newSessionExercises.length > 0) {
                const exercisesResult = await supabase.from('session_exercises').insert(newSessionExercises);
                if (exercisesResult.error) throw exercisesResult.error;
              }
            })
            .catch((error) => {
              console.error('Failed to sync duplicateRoutine:', error);
            });
        }

        return newRoutine;
      },

      // --- Actions: Sessions (Workout Templates) ---
      addSession: (routine_id, name) => {
        const { currentUser, sessions } = get();
        const routineSessions = sessions.filter(s => s.routine_id === routine_id);
        if (routineSessions.length >= MAX_SESSIONS_PER_ROUTINE) return null;

        const nextOrder = routineSessions.length + 1;
        const newSession = {
          id: generateUUID(),
          name,
          routine_id,
          session_order: nextOrder,
          user_id: currentUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        set((state) => ({ sessions: [...state.sessions, newSession] }));

        if (!currentUser.isGuest) {
          supabase.from('sessions').insert(newSession).then(({ error }) => {
            if (error) console.error('Failed to sync addSession:', error);
          });
        }

        return newSession;
      },
      deleteSession: (id) => {
        const { currentUser, sessions } = get();
        const sessionToDelete = sessions.find(s => s.id === id);
        if (!sessionToDelete) return;

        const routineId = sessionToDelete.routine_id;
        let finalSessions = [];

        set((state) => {
          const remainingSessions = state.sessions.filter(sn => sn.id !== id);
          
          const routineSessions = remainingSessions
            .filter(s => s.routine_id === routineId)
            .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));

          const orderMap = new Map();
          routineSessions.forEach((s, idx) => {
            orderMap.set(s.id, idx + 1);
          });

          finalSessions = remainingSessions.map(s => {
            if (s.routine_id === routineId) {
              return { ...s, session_order: orderMap.get(s.id) || 1 };
            }
            return s;
          });

          return {
            sessions: finalSessions,
            sessionExercises: state.sessionExercises.filter(se => se.session_id !== id)
          };
        });

        if (!currentUser.isGuest) {
          const sessionsToUpsert = finalSessions.filter(s => s.routine_id === routineId);
          supabase.from('sessions').delete().eq('id', id).then(({ error }) => {
            if (error) {
              console.error('Failed to sync deleteSession delete:', error);
            } else if (sessionsToUpsert.length > 0) {
              supabase.from('sessions').upsert(sessionsToUpsert).then(({ error: upsertError }) => {
                if (upsertError) console.error('Failed to sync deleteSession upsert:', upsertError);
              });
            }
          });
        }
      },
      updateSession: (id, name) => {
        const { currentUser } = get();
        const updatedAt = new Date().toISOString();
        
        set((state) => ({
          sessions: state.sessions.map(s => s.id === id ? { ...s, name, updated_at: updatedAt } : s)
        }));

        if (!currentUser.isGuest) {
          supabase.from('sessions').update({ name, updated_at: updatedAt }).eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to sync updateSession:', error);
          });
        }
      },
      reorderSessions: (routine_id, orderedSessionIds) => {
        const { currentUser } = get();
        let updatedSessions = [];
        
        set((state) => {
          updatedSessions = state.sessions.map(s => {
            if (s.routine_id === routine_id) {
              const newOrderIndex = orderedSessionIds.indexOf(s.id);
              if (newOrderIndex !== -1) {
                return { ...s, session_order: newOrderIndex + 1, updated_at: new Date().toISOString() };
              }
            }
            return s;
          });
          return { sessions: updatedSessions };
        });

        if (!currentUser.isGuest) {
          const sessionsToUpsert = updatedSessions.filter(s => s.routine_id === routine_id);
          supabase.from('sessions').upsert(sessionsToUpsert).then(({ error }) => {
            if (error) console.error('Failed to sync reorderSessions:', error);
          });
        }
      },

      // --- Actions: Session Exercises ---
      addSessionExercise: (session_id, exercise_id, order, target_sets, target_record) => {
        const { currentUser } = get();
        const newSessionExercise = {
          id: generateUUID(),
          session_id,
          exercise_id,
          order,
          target_sets,
          target_record,
          rest_between_sets: 90,
          rest_after_exercise: 120, 
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        set((state) => ({ sessionExercises: [...state.sessionExercises, newSessionExercise] }));

        if (!currentUser.isGuest) {
          Promise.resolve()
            .then(() => get().syncExercisesForReferences([exercise_id], currentUser.id))
            .then(() => supabase.from('session_exercises').insert(newSessionExercise))
            .then(({ error }) => {
              if (error) console.error('Failed to sync addSessionExercise:', error);
            })
            .catch((error) => {
              console.error('Failed to sync addSessionExercise:', error);
            });
        }

        return newSessionExercise;
      },
      deleteSessionExercise: (id) => {
        const { currentUser, sessionExercises } = get();
        const exerciseToDelete = sessionExercises.find(se => se.id === id);
        if (!exerciseToDelete) return;

        const sessionId = exerciseToDelete.session_id;
        let finalExercises = [];

        set((state) => {
          const remainingExercises = state.sessionExercises.filter(se => se.id !== id);

          const sessionExs = remainingExercises
            .filter(se => se.session_id === sessionId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const orderMap = new Map();
          sessionExs.forEach((se, idx) => {
            orderMap.set(se.id, idx + 1);
          });

          finalExercises = remainingExercises.map(se => {
            if (se.session_id === sessionId) {
              return { ...se, order: orderMap.get(se.id) || 1, updated_at: new Date().toISOString() };
            }
            return se;
          });

          return {
            sessionExercises: finalExercises
          };
        });

        if (!currentUser.isGuest) {
          const exercisesToUpsert = finalExercises.filter(se => se.session_id === sessionId);
          supabase.from('session_exercises').delete().eq('id', id).then(({ error }) => {
            if (error) {
              console.error('Failed to sync deleteSessionExercise delete:', error);
            } else if (exercisesToUpsert.length > 0) {
              supabase.from('session_exercises').upsert(exercisesToUpsert).then(({ error: upsertError }) => {
                if (upsertError) console.error('Failed to sync deleteSessionExercise upsert:', upsertError);
              });
            }
          });
        }
      },
      updateSessionExercise: (id, updates) => {
        const { currentUser } = get();
        const updatedAt = new Date().toISOString();
        
        set((state) => ({
          sessionExercises: state.sessionExercises.map(se => 
            se.id === id ? { ...se, ...updates, updated_at: updatedAt } : se
          )
        }));

        if (!currentUser.isGuest) {
          supabase.from('session_exercises').update({ ...updates, updated_at: updatedAt }).eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to sync updateSessionExercise:', error);
          });
        }
      },
      reorderSessionExercises: (session_id, orderedExerciseLinkIds) => {
        const { currentUser } = get();
        let updatedExercises = [];
        
        set((state) => {
          updatedExercises = state.sessionExercises.map(se => {
            if (se.session_id === session_id) {
              const newOrderIndex = orderedExerciseLinkIds.indexOf(se.id);
              if (newOrderIndex !== -1) {
                return { ...se, order: newOrderIndex + 1, updated_at: new Date().toISOString() };
              }
            }
            return se;
          });
          return { sessionExercises: updatedExercises };
        });

        if (!currentUser.isGuest) {
          const exercisesToUpsert = updatedExercises.filter(se => se.session_id === session_id);
          supabase.from('session_exercises').upsert(exercisesToUpsert).then(({ error }) => {
            if (error) console.error('Failed to sync reorderSessionExercises:', error);
          });
        }
      },

      // --- Actions: Workout Logs ---
      startWorkoutLog: (session_id = null) => {
        const { currentUser } = get();
        const newLog = {
          id: generateUUID(),
          user_id: currentUser.id,
          session_id,
          start_time: new Date().toISOString(),
          end_time: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        set((state) => ({ workoutLogs: [...state.workoutLogs, newLog] }));

        if (!currentUser.isGuest) {
          supabase.from('workout_logs').insert(newLog).then(({ error }) => {
            if (error) console.error('Failed to sync startWorkoutLog:', error);
          });
        }

        return newLog;
      },
      finishWorkoutLog: (id) => {
        const { currentUser } = get();
        const endTime = new Date().toISOString();
        
        set((state) => ({
          workoutLogs: state.workoutLogs.map(log => 
            log.id === id ? { ...log, end_time: endTime, updated_at: endTime } : log
          )
        }));

        if (!currentUser.isGuest) {
          supabase.from('workout_logs').update({ end_time: endTime, updated_at: endTime }).eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to sync finishWorkoutLog:', error);
          });
        }
      },
      deleteWorkoutLog: (id) => {
        const { currentUser } = get();
        
        set((state) => ({
          workoutLogs: state.workoutLogs.filter(log => log.id !== id),
          setRecords: state.setRecords.filter(sr => sr.workout_log_id !== id) 
        }));

        if (!currentUser.isGuest) {
          supabase.from('workout_logs').delete().eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to sync deleteWorkoutLog:', error);
          });
        }
      },
      saveWorkoutLog: (session_id, blocks, start_time) => {
        const { currentUser } = get();
        const logId = generateUUID();
        const endTime = new Date().toISOString();
        const actualStartTime = start_time || new Date().toISOString();

        const newLog = {
          id: logId,
          user_id: currentUser.id,
          session_id,
          start_time: actualStartTime,
          end_time: endTime,
          created_at: actualStartTime,
          updated_at: endTime
        };

        const newSetRecords = [];
        blocks.forEach((block) => {
          block.sets.forEach((set) => {
            const hasReps = String(set.reps ?? '').trim() !== '';
            const hasWeight = String(set.weight ?? '').trim() !== '';
            if (hasReps) {
              newSetRecords.push({
                id: generateUUID(),
                workout_log_id: logId,
                exercise_id: block.exercise_id,
                set_number: set.set_number,
                weight: hasWeight ? Number(set.weight) : 0,
                record: String(set.reps || '0').trim(),
                side: set.side || 'both',
                memo: set.memo || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          });
        });

        set((state) => ({
          workoutLogs: [...state.workoutLogs, newLog],
          setRecords: [...state.setRecords, ...newSetRecords]
        }));

        if (!currentUser.isGuest) {
          Promise.resolve()
            .then(() => get().syncExercisesForReferences(newSetRecords.map(record => record.exercise_id), currentUser.id))
            .then(async () => {
              const logResult = await supabase.from('workout_logs').insert(newLog);
              if (logResult.error) throw logResult.error;

              if (newSetRecords.length > 0) {
                const recordsResult = await supabase.from('set_records').insert(newSetRecords);
                if (recordsResult.error) throw recordsResult.error;
              }
            })
            .catch((error) => {
              console.error('Failed to sync saveWorkoutLog:', error);
            });
        }

        return newLog;
      },

      // --- Actions: Set Records ---
      addSetRecord: (workout_log_id, exercise_id, set_number, weight, record, side = 'both', memo = null) => {
        const { currentUser } = get();
        const newSetRecord = {
          id: generateUUID(),
          workout_log_id,
          exercise_id,
          set_number,
          weight,
          record,
          side,
          memo,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        set((state) => ({ setRecords: [...state.setRecords, newSetRecord] }));

        if (!currentUser.isGuest) {
          Promise.resolve()
            .then(() => get().syncExercisesForReferences([exercise_id], currentUser.id))
            .then(() => supabase.from('set_records').insert(newSetRecord))
            .then(({ error }) => {
              if (error) console.error('Failed to sync addSetRecord:', error);
            })
            .catch((error) => {
              console.error('Failed to sync addSetRecord:', error);
            });
        }

        return newSetRecord;
      },
      updateSetRecord: (id, updates) => {
        const { currentUser } = get();
        const updatedAt = new Date().toISOString();
        
        set((state) => ({
          setRecords: state.setRecords.map(sr => 
            sr.id === id ? { ...sr, ...updates, updated_at: updatedAt } : sr
          )
        }));

        if (!currentUser.isGuest) {
          supabase.from('set_records').update({ ...updates, updated_at: updatedAt }).eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to sync updateSetRecord:', error);
          });
        }
      },
      deleteSetRecord: (id) => {
        const { currentUser } = get();
        set((state) => ({
          setRecords: state.setRecords.filter(sr => sr.id !== id)
        }));

        if (!currentUser.isGuest) {
          supabase.from('set_records').delete().eq('id', id).then(({ error }) => {
            if (error) console.error('Failed to sync deleteSetRecord:', error);
          });
        }
      },

      // --- Debug / Utils ---
      clearAllData: () => {
        const { exercises, currentUser } = get();
        set({
          exercises: exercises.length > 0 ? exercises : DEFAULT_EXERCISES,
          routines: [],
          sessions: [],
          sessionExercises: [],
          workoutLogs: [],
          setRecords: []
        });

        if (!currentUser.isGuest) {
          const userId = currentUser.id;
          Promise.resolve().then(async () => {
            const routineResult = await supabase.from('routines').delete().eq('user_id', userId);
            if (routineResult.error) throw routineResult.error;

            const logResult = await supabase.from('workout_logs').delete().eq('user_id', userId);
            if (logResult.error) throw logResult.error;
          }).catch((error) => {
            console.error('Failed to sync clearAllData:', error);
          });
        }
      },
      generateDummyData: () => {
        const { currentUser, exercises } = get();
        const seedData = createDummyWorkoutData({
          userId: currentUser?.id || '00000000-0000-0000-0000-000000000000',
          existingExercises: exercises,
        });

        set(seedData);

        if (!currentUser.isGuest) {
          Promise.resolve().then(async () => {
            try {
              set({ isSyncing: true });
              
              // Clear old data to prevent foreign key issues and duplicates
              throwIfSupabaseError(await supabase.from('routines').delete().eq('user_id', currentUser.id));
              throwIfSupabaseError(await supabase.from('workout_logs').delete().eq('user_id', currentUser.id));
              
              const customExercises = uniqueById(seedData.exercises).filter(exercise => !isPublicMasterExercise(exercise));
              if (customExercises.length > 0) {
                const exerciseRows = customExercises.map(exercise => exerciseForSupabase(exercise, currentUser.id));
                throwIfSupabaseError(await supabase.from('exercises').upsert(exerciseRows));
              }
              if (seedData.routines.length > 0) {
                throwIfSupabaseError(await supabase.from('routines').insert(seedData.routines));
              }
              if (seedData.sessions.length > 0) {
                throwIfSupabaseError(await supabase.from('sessions').insert(seedData.sessions));
              }
              if (seedData.sessionExercises.length > 0) {
                throwIfSupabaseError(await supabase.from('session_exercises').insert(seedData.sessionExercises));
              }
              if (seedData.workoutLogs.length > 0) {
                throwIfSupabaseError(await supabase.from('workout_logs').insert(seedData.workoutLogs));
              }
              if (seedData.setRecords.length > 0) {
                throwIfSupabaseError(await supabase.from('set_records').insert(seedData.setRecords));
              }
              console.log('Dummy data successfully generated and synced with Supabase!');
            } catch (err) {
              console.error('Failed to sync generateDummyData:', err);
            } finally {
              set({ isSyncing: false });
            }
          });
        }
      }
    }),
    {
      name: 'workout-tracker-storage', // Key for local storage
      version: 7,
      migrate: (persistedState, version) => {
        let newState = { ...persistedState };

        if (version < 1) {
          // routines -> sessions
          const sessions = (newState.routines || []).map(r => ({
            id: r.id,
            name: r.name,
            user_id: r.user_id,
            created_at: r.created_at,
            updated_at: r.updated_at
          }));

          // routineExercises -> sessionExercises
          const sessionExercises = (newState.routineExercises || []).map(re => ({
            id: re.id,
            session_id: re.routine_id, 
            exercise_id: re.exercise_id,
            order: re.order,
            target_sets: re.target_sets,
            target_record: re.target_record,
            created_at: re.created_at,
            updated_at: re.updated_at
          }));

          // workoutLogs: map routine_id to session_id inside logs
          const workoutLogs = (newState.workoutLogs || []).map(log => ({
            ...log,
            session_id: log.routine_id 
          }));

          // Clean up old fields
          delete newState.routines;
          delete newState.routineExercises;

          newState = {
            ...newState,
            sessions,
            sessionExercises,
            workoutLogs
          };
        }

        if (version < 2) {
          const defaultRoutineId = generateUUID();
          const defaultRoutine = {
            id: defaultRoutineId,
            name: '기본 루틴',
            user_id: newState.currentUser?.id || '00000000-0000-0000-0000-000000000000',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const routines = newState.routines && newState.routines.length > 0
            ? newState.routines
            : [defaultRoutine];

          const sessions = (newState.sessions || []).map(s => ({
            ...s,
            routine_id: s.routine_id || defaultRoutineId
          }));

          newState = {
            ...newState,
            routines,
            sessions
          };
        }

        if (version < 3) {
          newState = {
            ...newState,
            exercises: (newState.exercises || DEFAULT_EXERCISES).map((exercise) => ({
              ...exercise,
              primary_muscle: normalizeMuscleLabel(exercise.primary_muscle) || '기타',
            })),
          };
        }

        if (version < 4) {
          newState = {
            ...newState,
            exercises: (newState.exercises || DEFAULT_EXERCISES).map((exercise) => ({
              ...exercise,
              unit: exercise.unit || getDefaultExerciseUnit(exercise.name),
            })),
          };
        }

        if (version < 5) {
          newState = {
            ...newState,
            exercises: (newState.exercises || DEFAULT_EXERCISES).map((exercise) => ({
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
            exercises: (newState.exercises || DEFAULT_EXERCISES).map((exercise) => {
              const dictEntry = EXERCISE_DICTIONARY.find(ex => 
                ex.name.toLowerCase() === exercise.name.toLowerCase() || 
                (ex.synonyms && ex.synonyms.includes(exercise.name.toLowerCase()))
              );
              return {
                ...exercise,
                is_unilateral: dictEntry ? (dictEntry.is_unilateral ?? false) : (exercise.is_unilateral ?? false)
              };
            })
          };
        }

        if (version < 7) {
          const idMap = new Map();
          const migratedExercises = [];
          const seenExerciseIds = new Set();

          (newState.exercises || DEFAULT_EXERCISES).forEach((exercise) => {
            const defaultExercise = DEFAULT_EXERCISE_BY_NAME.get((exercise.name || '').toLowerCase());
            const nextExercise = normalizeExerciseForApp(defaultExercise ? {
              ...exercise,
              id: defaultExercise.id,
              user_id: null,
            } : exercise);

            if (defaultExercise && exercise.id !== defaultExercise.id) {
              idMap.set(exercise.id, defaultExercise.id);
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

        return newState;
      }
    }
  )
);
