import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EXERCISE_DICTIONARY } from '../data/exerciseDictionary';

const generateUUID = () => crypto.randomUUID();

// Default seed exercises with muscle and equipment info
const DEFAULT_EXERCISES = [
  { id: generateUUID(), name: '벤치프레스', primary_muscle: '가슴', equipment: '바벨', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '스쿼트', primary_muscle: '허벅지 앞 (대퇴사두)', equipment: '바벨', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '데드리프트', primary_muscle: '등 (하부/허리)', equipment: '바벨', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '풀업', primary_muscle: '등 (광배근)', equipment: '맨몸', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '바벨 로우', primary_muscle: '등 (중부)', equipment: '바벨', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '오버헤드 프레스', primary_muscle: '어깨', equipment: '바벨', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '바벨 컬', primary_muscle: '이두', equipment: '바벨', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '레그 익스텐션', primary_muscle: '허벅지 앞 (대퇴사두)', equipment: '머신', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '푸시업', primary_muscle: '가슴', equipment: '맨몸', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '플랭크', primary_muscle: '복근', equipment: '맨몸', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

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
      addExercise: (name, primary_muscle = null, equipment = null, unit = 'kg') => {
        const { currentUser, exercises } = get();
        
        // 중복 방지
        const existing = exercises.find(ex => ex.name.toLowerCase() === name.toLowerCase());
        if (existing) return existing;

        // 로컬 사전에 주동근/장비가 정의되어 있다면 가져옴
        let muscle = primary_muscle;
        let equip = equipment;
        if (!muscle || !equip) {
          const dictEntry = EXERCISE_DICTIONARY.find(ex => 
            ex.name.toLowerCase() === name.toLowerCase() || 
            (ex.synonyms && ex.synonyms.includes(name.toLowerCase()))
          );
          if (dictEntry) {
            muscle = muscle || dictEntry.primaryMuscle;
            equip = equip || dictEntry.equipment;
          }
        }

        const newExercise = {
          id: generateUUID(),
          name,
          primary_muscle: muscle || '기타',
          equipment: equip || '기타',
          unit,
          user_id: currentUser.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        set((state) => ({ exercises: [...state.exercises, newExercise] }));
        return newExercise;
      },
      deleteExercise: (id) => set((state) => ({ exercises: state.exercises.filter(ex => ex.id !== id) })),

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
      addSetRecord: (workout_log_id, exercise_id, set_number, weight, record, is_completed = false, memo = null) => {
        const newSetRecord = {
          id: generateUUID(),
          workout_log_id,
          exercise_id,
          set_number,
          weight,
          record,
          is_completed,
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
      clearAllData: () => set({
        exercises: DEFAULT_EXERCISES,
        routines: [],
        sessions: [],
        sessionExercises: [],
        workoutLogs: [],
        setRecords: []
      }),
      generateDummyData: () => {
        const { exercises } = get();
        const currentUser = { id: generateUUID() };
        
        // Find exercise IDs for mapping
        const exMap = exercises.reduce((acc, ex) => {
          acc[ex.name] = ex.id;
          return acc;
        }, {});

        const getPastDate = (daysAgo) => {
          const d = new Date();
          d.setDate(d.getDate() - daysAgo);
          return d;
        };

        // 1. Create Routines
        const routine1Id = generateUUID();
        const routines = [
          { id: routine1Id, name: '2분할 상하체 루틴', user_id: currentUser.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        ];

        // 2. Create Sessions (Templates)
        const session1Id = generateUUID();
        const session2Id = generateUUID();
        const sessions = [
          { id: session1Id, name: '상체 (Push & Pull)', routine_id: routine1Id, session_order: 1, user_id: currentUser.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: session2Id, name: '하체 (Legs)', routine_id: routine1Id, session_order: 2, user_id: currentUser.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ];

        // 3. Create Session Exercises
        const sessionExercises = [
          // 상체
          { id: generateUUID(), session_id: session1Id, exercise_id: exMap['벤치프레스'], order: 1, target_sets: 4, target_record: '10', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: generateUUID(), session_id: session1Id, exercise_id: exMap['풀업'], order: 2, target_sets: 4, target_record: '8', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: generateUUID(), session_id: session1Id, exercise_id: exMap['오버헤드 프레스'], order: 3, target_sets: 3, target_record: '10', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          // 하체
          { id: generateUUID(), session_id: session2Id, exercise_id: exMap['스쿼트'], order: 1, target_sets: 5, target_record: '5', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: generateUUID(), session_id: session2Id, exercise_id: exMap['데드리프트'], order: 2, target_sets: 3, target_record: '5', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: generateUUID(), session_id: session2Id, exercise_id: exMap['레그 익스텐션'], order: 3, target_sets: 3, target_record: '15', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ];

        // 4. Create Workout Logs (Past few weeks)
        const workoutLogs = [];
        const setRecords = [];

        // Helper to add upper body log
        const addUpperLog = (daysAgo, benchWeight, pullupWeight = 0, ohpWeight = 30) => {
          const logId = generateUUID();
          const start = getPastDate(daysAgo);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          workoutLogs.push({
            id: logId, user_id: currentUser.id, session_id: session1Id,
            start_time: start.toISOString(), end_time: end.toISOString(),
            created_at: start.toISOString(), updated_at: end.toISOString()
          });

          // 벤치프레스
          setRecords.push(
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['벤치프레스'], set_number: 1, weight: benchWeight - 20, record: '10', is_completed: true, memo: '워밍업', created_at: start.toISOString(), updated_at: end.toISOString() },
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['벤치프레스'], set_number: 2, weight: benchWeight, record: '8', is_completed: true, memo: null, created_at: start.toISOString(), updated_at: end.toISOString() },
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['벤치프레스'], set_number: 3, weight: benchWeight, record: daysAgo === 2 ? '7' : '8', is_completed: true, memo: daysAgo === 2 ? '조금 무거움' : null, created_at: start.toISOString(), updated_at: end.toISOString() }
          );
          // 풀업 (Bodyweight or Weighted)
          setRecords.push(
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['풀업'], set_number: 1, weight: pullupWeight, record: '8', is_completed: true, memo: pullupWeight === 0 ? '맨몸' : '중량 풀업', created_at: start.toISOString(), updated_at: end.toISOString() },
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['풀업'], set_number: 2, weight: pullupWeight, record: '7', is_completed: true, memo: null, created_at: start.toISOString(), updated_at: end.toISOString() },
          );
          // 오버헤드 프레스
          setRecords.push(
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['오버헤드 프레스'], set_number: 1, weight: ohpWeight, record: '10', is_completed: true, memo: null, created_at: start.toISOString(), updated_at: end.toISOString() },
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['오버헤드 프레스'], set_number: 2, weight: ohpWeight, record: '8', is_completed: true, memo: null, created_at: start.toISOString(), updated_at: end.toISOString() }
          );
        };

        // Helper to add lower body log
        const addLowerLog = (daysAgo, squatWeight, deadWeight = 80, legExtWeight = 30) => {
          const logId = generateUUID();
          const start = getPastDate(daysAgo);
          const end = new Date(start.getTime() + 75 * 60 * 1000);
          workoutLogs.push({
            id: logId, user_id: currentUser.id, session_id: session2Id,
            start_time: start.toISOString(), end_time: end.toISOString(),
            created_at: start.toISOString(), updated_at: end.toISOString()
          });

          // 스쿼트
          setRecords.push(
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['스쿼트'], set_number: 1, weight: squatWeight, record: '5', is_completed: true, memo: null, created_at: start.toISOString(), updated_at: end.toISOString() },
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['스쿼트'], set_number: 2, weight: squatWeight, record: '5', is_completed: true, memo: null, created_at: start.toISOString(), updated_at: end.toISOString() },
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['스쿼트'], set_number: 3, weight: squatWeight + 10, record: daysAgo === 1 ? '3' : '5', is_completed: true, memo: daysAgo === 1 ? 'PR 도전' : null, created_at: start.toISOString(), updated_at: end.toISOString() }
          );
          // 데드리프트
          setRecords.push(
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['데드리프트'], set_number: 1, weight: deadWeight, record: '5', is_completed: true, memo: null, created_at: start.toISOString(), updated_at: end.toISOString() },
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['데드리프트'], set_number: 2, weight: deadWeight, record: '5', is_completed: true, memo: null, created_at: start.toISOString(), updated_at: end.toISOString() }
          );
          // 레그 익스텐션
          setRecords.push(
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['레그 익스텐션'], set_number: 1, weight: legExtWeight, record: '15', is_completed: true, memo: null, created_at: start.toISOString(), updated_at: end.toISOString() },
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['레그 익스텐션'], set_number: 2, weight: legExtWeight, record: '12', is_completed: true, memo: null, created_at: start.toISOString(), updated_at: end.toISOString() }
          );
        };

        // Helper to add free workout log (e.g. Core Plank workout)
        const addFreeLog = (daysAgo, plankSec) => {
          const logId = generateUUID();
          const start = getPastDate(daysAgo);
          const end = new Date(start.getTime() + 20 * 60 * 1000);
          workoutLogs.push({
            id: logId, user_id: currentUser.id, session_id: null, // session_id: null for free workouts
            start_time: start.toISOString(), end_time: end.toISOString(),
            created_at: start.toISOString(), updated_at: end.toISOString()
          });

          // 플랭크 (Time-based bodyweight exercise: weight = 0, record = seconds)
          setRecords.push(
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['플랭크'], set_number: 1, weight: 0, record: String(plankSec), is_completed: true, memo: '코어 단련', created_at: start.toISOString(), updated_at: end.toISOString() },
            { id: generateUUID(), workout_log_id: logId, exercise_id: exMap['플랭크'], set_number: 2, weight: 0, record: String(plankSec - 10), is_completed: true, memo: '힘듦', created_at: start.toISOString(), updated_at: end.toISOString() }
          );
        };

        // 점진적 과부하를 보여주는 히스토리 데이터 생성 (최근 2주)
        addUpperLog(14, 60, 0, 30);
        addLowerLog(12, 80, 90, 40);
        addUpperLog(10, 70, 0, 35);
        addLowerLog(8, 90, 100, 45);
        addUpperLog(6, 75, 0, 40);
        addFreeLog(5, 60);         // 5일 전 코어 자유 운동
        addLowerLog(4, 95, 110, 50);
        addFreeLog(3, 75);         // 3일 전 코어 자유 운동
        addUpperLog(2, 80, 5, 45);  // 2일 전 상체 (중량 풀업 5kg 추가, OHP 45kg)
        addLowerLog(1, 100, 120, 55); // 1일 전 하체 (데드리프트 120kg, 레그 익스텐션 55kg)

        set({
          currentUser,
          routines,
          sessions,
          sessionExercises,
          workoutLogs,
          setRecords
        });
      }
    }),
    {
      name: 'workout-tracker-storage', // Key for local storage
      version: 2, // Upgrade to version 2
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

        return newState;
      }
    }
  )
);

