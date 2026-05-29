import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EXERCISE_DICTIONARY } from '../data/exerciseDictionary.js';
import { normalizeMuscleLabel } from '../data/muscleGroups.js';
import {
  MAX_SESSIONS_PER_ROUTINE,
  TEMPORARY_SESSION_ORDER,
  getRegularRoutineSessions,
  getRoutineTemporarySession,
  isTemporarySession,
} from '../utils/sessionHelper.js';
import { DEFAULT_EXERCISES, createDummyWorkoutData, generateUUID } from '../data/dummyGenerator.js';
import { migrateWorkoutPersistState } from './workoutPersistenceMigration.js';
import * as workoutRepository from '../api/supabaseWorkoutRepository.js';

const GUEST_USER = { id: '00000000-0000-0000-0000-000000000000', name: '게스트', isGuest: true };

const runRemoteSync = (label, task) => {
  Promise.resolve()
    .then(task)
    .catch((error) => {
      console.error(`Failed to sync ${label}:`, error);
    });
};

const initialSeed = createDummyWorkoutData({ userId: GUEST_USER.id, existingExercises: DEFAULT_EXERCISES });

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      // --- State ---
      currentUser: GUEST_USER, 
      exercises: initialSeed.exercises,
      routines: initialSeed.routines,
      sessions: initialSeed.sessions,
      sessionExercises: initialSeed.sessionExercises,
      workoutLogs: initialSeed.workoutLogs,
      setRecords: initialSeed.setRecords,
      
      // Supabase specific states
      isSyncing: false,
      authSession: null,

      // --- Supabase Actions ---
      fetchPublicExercises: async () => {
        try {
          const exercises = await workoutRepository.fetchPublicExerciseCatalog();
          set({ exercises });
        } catch (error) {
          console.error('Failed to fetch public exercises from Supabase:', error);
        }
      },

      syncExercisesForReferences: async (exerciseIds, userId) => {
        if (!userId || userId === GUEST_USER.id) return;
        await workoutRepository.syncExercisesForReferences({
          exercises: get().exercises,
          exerciseIds,
          userId,
        });
      },

      setAuthSession: async (session) => {
        const previousState = get();
        const previousUser = previousState.currentUser;
        
        if (session) {
          const user = session.user;
          if (
            previousState.authSession?.user?.id === user.id &&
            previousState.authSession?.access_token === session.access_token &&
            previousUser.id === user.id
          ) {
            return;
          }

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
          if (!previousState.authSession && previousUser.isGuest) {
            return;
          }

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
          set(await workoutRepository.fetchUserWorkoutData(currentUser.id));
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
          await workoutRepository.migrateLocalDataToSupabase({
            authUserId,
            exercises,
            routines,
            sessions,
            sessionExercises,
            workoutLogs,
            setRecords,
          });
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
          runRemoteSync('addExercise', () => workoutRepository.insertExercise(newExercise, currentUser.id));
        }

        return newExercise;
      },
      deleteExercise: (id) => {
        const { currentUser } = get();
        set((state) => ({ exercises: state.exercises.filter(ex => ex.id !== id) }));
        
        if (!currentUser.isGuest) {
          runRemoteSync('deleteExercise', () => workoutRepository.deleteRow('exercises', id));
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
          runRemoteSync('updateExercise', () => workoutRepository.updateExercise(id, updates, updatedAt));
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
          runRemoteSync('addRoutine', () => workoutRepository.insertRow('routines', newRoutine));
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
          runRemoteSync('deleteRoutine', () => workoutRepository.deleteRow('routines', id));
        }
      },
      updateRoutine: (id, name) => {
        const { currentUser } = get();
        const updatedAt = new Date().toISOString();
        
        set((state) => ({
          routines: state.routines.map(r => r.id === id ? { ...r, name, updated_at: updatedAt } : r)
        }));

        if (!currentUser.isGuest) {
          runRemoteSync('updateRoutine', () =>
            workoutRepository.updateRow('routines', id, { name, updated_at: updatedAt }),
          );
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
          runRemoteSync('duplicateRoutine', async () => {
            await get().syncExercisesForReferences(newSessionExercises.map(se => se.exercise_id), currentUser.id);
            await workoutRepository.insertRow('routines', newRoutine);
            await workoutRepository.insertRows('sessions', newSessions);
            await workoutRepository.insertRows('session_exercises', newSessionExercises);
          });
        }

        return newRoutine;
      },

      // --- Actions: Sessions (Workout Templates) ---
      addSession: (routine_id, name) => {
        const { currentUser, sessions } = get();
        const routineSessions = getRegularRoutineSessions(sessions, routine_id);
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
          runRemoteSync('addSession', () => workoutRepository.insertRow('sessions', newSession));
        }

        return newSession;
      },
      createTemporarySession: (routine_id, name = '임시 세션') => {
        if (!routine_id) return null;
        const { currentUser, sessions } = get();
        const existingTemporarySession = getRoutineTemporarySession(sessions, routine_id);
        if (existingTemporarySession) return existingTemporarySession;

        const createdAt = new Date().toISOString();
        const newSession = {
          id: generateUUID(),
          name,
          routine_id,
          session_order: TEMPORARY_SESSION_ORDER,
          user_id: currentUser.id,
          created_at: createdAt,
          updated_at: createdAt
        };

        set((state) => ({ sessions: [...state.sessions, newSession] }));

        if (!currentUser.isGuest) {
          runRemoteSync('createTemporarySession', () => workoutRepository.insertRow('sessions', newSession));
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
            .filter(s => s.routine_id === routineId && !isTemporarySession(s))
            .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));

          const orderMap = new Map();
          routineSessions.forEach((s, idx) => {
            orderMap.set(s.id, idx + 1);
          });

          finalSessions = remainingSessions.map(s => {
            if (s.routine_id === routineId && !isTemporarySession(s)) {
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
          runRemoteSync('deleteSession', async () => {
            await workoutRepository.deleteRow('sessions', id);
            await workoutRepository.upsertRows('sessions', sessionsToUpsert);
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
          runRemoteSync('updateSession', () =>
            workoutRepository.updateRow('sessions', id, { name, updated_at: updatedAt }),
          );
        }
      },
      reorderSessions: (routine_id, orderedSessionIds) => {
        const { currentUser } = get();
        let updatedSessions = [];
        
        set((state) => {
          updatedSessions = state.sessions.map(s => {
            if (s.routine_id === routine_id && !isTemporarySession(s)) {
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
          runRemoteSync('reorderSessions', () => workoutRepository.upsertRows('sessions', sessionsToUpsert));
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
          runRemoteSync('addSessionExercise', async () => {
            await get().syncExercisesForReferences([exercise_id], currentUser.id);
            await workoutRepository.insertRow('session_exercises', newSessionExercise);
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
          runRemoteSync('deleteSessionExercise', async () => {
            await workoutRepository.deleteRow('session_exercises', id);
            await workoutRepository.upsertRows('session_exercises', exercisesToUpsert);
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
          runRemoteSync('updateSessionExercise', () =>
            workoutRepository.updateRow('session_exercises', id, { ...updates, updated_at: updatedAt }),
          );
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
          runRemoteSync('reorderSessionExercises', () =>
            workoutRepository.upsertRows('session_exercises', exercisesToUpsert),
          );
        }
      },

      // --- Actions: Workout Logs ---
      startWorkoutLog: (session_id) => {
        if (!session_id) {
          throw new Error('session_id is required to start a workout log.');
        }
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
          runRemoteSync('startWorkoutLog', () => workoutRepository.insertRow('workout_logs', newLog));
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
          runRemoteSync('finishWorkoutLog', () =>
            workoutRepository.updateRow('workout_logs', id, { end_time: endTime, updated_at: endTime }),
          );
        }
      },
      deleteWorkoutLog: (id) => {
        const { currentUser } = get();
        
        set((state) => ({
          workoutLogs: state.workoutLogs.filter(log => log.id !== id),
          setRecords: state.setRecords.filter(sr => sr.workout_log_id !== id) 
        }));

        if (!currentUser.isGuest) {
          runRemoteSync('deleteWorkoutLog', () => workoutRepository.deleteRow('workout_logs', id));
        }
      },
      saveWorkoutLog: (session_id, blocks, start_time) => {
        if (!session_id) {
          throw new Error('session_id is required to save a workout log.');
        }
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
          runRemoteSync('saveWorkoutLog', async () => {
            await get().syncExercisesForReferences(newSetRecords.map(record => record.exercise_id), currentUser.id);
            await workoutRepository.insertRow('workout_logs', newLog);
            await workoutRepository.insertRows('set_records', newSetRecords);
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
          runRemoteSync('addSetRecord', async () => {
            await get().syncExercisesForReferences([exercise_id], currentUser.id);
            await workoutRepository.insertRow('set_records', newSetRecord);
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
          runRemoteSync('updateSetRecord', () =>
            workoutRepository.updateRow('set_records', id, { ...updates, updated_at: updatedAt }),
          );
        }
      },
      deleteSetRecord: (id) => {
        const { currentUser } = get();
        set((state) => ({
          setRecords: state.setRecords.filter(sr => sr.id !== id)
        }));

        if (!currentUser.isGuest) {
          runRemoteSync('deleteSetRecord', () => workoutRepository.deleteRow('set_records', id));
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
          runRemoteSync('clearAllData', () => workoutRepository.clearUserWorkoutData(userId));
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
              await workoutRepository.replaceUserWorkoutDataWithSeed(seedData, currentUser.id);
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
      migrate: migrateWorkoutPersistState
    }
  )
);
