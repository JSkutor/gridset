import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EXERCISE_DICTIONARY } from '../data/exerciseDictionary.js';
import { normalizeMuscleLabel } from '../data/muscleGroups.js';
import { MAX_SESSIONS_PER_ROUTINE } from '../utils/sessionHelper.js';
import { DEFAULT_EXERCISES, createDummyWorkoutData, generateUUID } from '../data/dummyGenerator.js';


export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      // --- State ---
      // We generate a mock user ID for local usage, simulating the Supabase user
      currentUser: { id: '00000000-0000-0000-0000-000000000000', name: '게스트', isGuest: true }, 
      exercises: DEFAULT_EXERCISES,
      routines: [],
      sessions: [],
      sessionExercises: [],
      workoutLogs: [],
      setRecords: [],

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
        return newExercise;
      },
      deleteExercise: (id) => set((state) => ({ exercises: state.exercises.filter(ex => ex.id !== id) })),
      updateExercise: (id, updates) => {
        set((state) => ({
          exercises: state.exercises.map(ex =>
            ex.id === id ? { ...ex, ...updates, updated_at: new Date().toISOString() } : ex
          )
        }));
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
        return newRoutine;
      },
      deleteRoutine: (id) => {
        const { sessions } = get();
        const sessionsToDelete = sessions.filter(s => s.routine_id === id);
        const sessionIdsToDelete = sessionsToDelete.map(s => s.id);
        set((state) => ({
          routines: state.routines.filter(r => r.id !== id),
          sessions: state.sessions.filter(s => s.routine_id !== id),
          sessionExercises: state.sessionExercises.filter(se => !sessionIdsToDelete.includes(se.session_id))
        }));
      },
      updateRoutine: (id, name) => set((state) => ({
        routines: state.routines.map(r => r.id === id ? { ...r, name, updated_at: new Date().toISOString() } : r)
      })),
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
        return newSession;
      },
      deleteSession: (id) => {
        const { sessions } = get();
        const sessionToDelete = sessions.find(s => s.id === id);
        if (!sessionToDelete) return;

        const routineId = sessionToDelete.routine_id;

        set((state) => {
          const remainingSessions = state.sessions.filter(sn => sn.id !== id);
          
          // 삭제된 세션과 같은 루틴 내 세션들을 순서대로 정렬 후 순번 재할당
          const routineSessions = remainingSessions
            .filter(s => s.routine_id === routineId)
            .sort((a, b) => (a.session_order || 0) - (b.session_order || 0));

          const orderMap = new Map();
          routineSessions.forEach((s, idx) => {
            orderMap.set(s.id, idx + 1);
          });

          const finalSessions = remainingSessions.map(s => {
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
      },
      updateSession: (id, name) => set((state) => ({
        sessions: state.sessions.map(s => s.id === id ? { ...s, name, updated_at: new Date().toISOString() } : s)
      })),
      reorderSessions: (routine_id, orderedSessionIds) => {
        set((state) => ({
          sessions: state.sessions.map(s => {
            if (s.routine_id === routine_id) {
              const newOrderIndex = orderedSessionIds.indexOf(s.id);
              if (newOrderIndex !== -1) {
                return { ...s, session_order: newOrderIndex + 1, updated_at: new Date().toISOString() };
              }
            }
            return s;
          })
        }));
      },

      // --- Actions: Session Exercises ---
      addSessionExercise: (session_id, exercise_id, order, target_sets, target_record) => {
        const newSessionExercise = {
          id: generateUUID(),
          session_id,
          exercise_id,
          order,
          target_sets,
          target_record,
          rest_between_sets: 90,
          rest_after_exercise: 120, // UI 기본 휴식시간이 120초(2분)이므로 일치시킵니다.
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        set((state) => ({ sessionExercises: [...state.sessionExercises, newSessionExercise] }));
        return newSessionExercise;
      },
      deleteSessionExercise: (id) => {
        const { sessionExercises } = get();
        const exerciseToDelete = sessionExercises.find(se => se.id === id);
        if (!exerciseToDelete) return;

        const sessionId = exerciseToDelete.session_id;

        set((state) => {
          const remainingExercises = state.sessionExercises.filter(se => se.id !== id);

          // 삭제된 운동과 같은 세션 내 운동들을 순서대로 정렬 후 순번 재할당
          const sessionExs = remainingExercises
            .filter(se => se.session_id === sessionId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const orderMap = new Map();
          sessionExs.forEach((se, idx) => {
            orderMap.set(se.id, idx + 1);
          });

          const finalExercises = remainingExercises.map(se => {
            if (se.session_id === sessionId) {
              return { ...se, order: orderMap.get(se.id) || 1, updated_at: new Date().toISOString() };
            }
            return se;
          });

          return {
            sessionExercises: finalExercises
          };
        });
      },
      updateSessionExercise: (id, updates) => set((state) => ({
        sessionExercises: state.sessionExercises.map(se => 
          se.id === id ? { ...se, ...updates, updated_at: new Date().toISOString() } : se
        )
      })),
      reorderSessionExercises: (session_id, orderedExerciseLinkIds) => {
        set((state) => ({
          sessionExercises: state.sessionExercises.map(se => {
            if (se.session_id === session_id) {
              const newOrderIndex = orderedExerciseLinkIds.indexOf(se.id);
              if (newOrderIndex !== -1) {
                return { ...se, order: newOrderIndex + 1, updated_at: new Date().toISOString() };
              }
            }
            return se;
          })
        }));
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
        return newLog;
      },
      finishWorkoutLog: (id) => set((state) => ({
        workoutLogs: state.workoutLogs.map(log => 
          log.id === id ? { ...log, end_time: new Date().toISOString(), updated_at: new Date().toISOString() } : log
        )
      })),
      deleteWorkoutLog: (id) => set((state) => ({
        workoutLogs: state.workoutLogs.filter(log => log.id !== id),
        setRecords: state.setRecords.filter(sr => sr.workout_log_id !== id) // Cascade delete
      })),

      // --- Actions: Set Records ---
      addSetRecord: (workout_log_id, exercise_id, set_number, weight, record, side = 'both', memo = null) => {
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
        return newSetRecord;
      },
      updateSetRecord: (id, updates) => set((state) => ({
        setRecords: state.setRecords.map(sr => 
          sr.id === id ? { ...sr, ...updates, updated_at: new Date().toISOString() } : sr
        )
      })),
      deleteSetRecord: (id) => set((state) => ({
        setRecords: state.setRecords.filter(sr => sr.id !== id)
      })),

      // --- Debug / Utils ---
      clearAllData: () => {
        const { exercises } = get();
        set({
          exercises: exercises.length > 0 ? exercises : DEFAULT_EXERCISES,
          routines: [],
          sessions: [],
          sessionExercises: [],
          workoutLogs: [],
          setRecords: []
        });
      },
      generateDummyData: () => {
        const { currentUser, exercises } = get();
        const seedData = createDummyWorkoutData({
          userId: currentUser?.id || '00000000-0000-0000-0000-000000000000',
          existingExercises: exercises,
        });

        set(seedData);
      }
    }),
    {
      name: 'workout-tracker-storage', // Key for local storage
      version: 6,
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
            session_id: re.routine_id, // Map routine_id to session_id
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
            session_id: log.routine_id // Map routine_id to session_id
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
          // Re-introducing routines! Map existing sessions to a default routine.
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

        return newState;
      }
    }
  )
);
