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
      currentUser: { id: generateUUID() }, 
      exercises: DEFAULT_EXERCISES,
      routines: [],
      routineExercises: [],
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
      deleteRoutine: (id) => set((state) => ({
        routines: state.routines.filter(rt => rt.id !== id),
        // Cascade delete routine exercises
        routineExercises: state.routineExercises.filter(re => re.routine_id !== id)
      })),

      // --- Actions: Routine Exercises ---
      addRoutineExercise: (routine_id, exercise_id, order, target_sets, target_record) => {
        const newRoutineExercise = {
          id: generateUUID(),
          routine_id,
          exercise_id,
          order,
          target_sets,
          target_record,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        set((state) => ({ routineExercises: [...state.routineExercises, newRoutineExercise] }));
        return newRoutineExercise;
      },
      deleteRoutineExercise: (id) => set((state) => ({
        routineExercises: state.routineExercises.filter(re => re.id !== id)
      })),
      updateRoutineExercise: (id, updates) => set((state) => ({
        routineExercises: state.routineExercises.map(re => 
          re.id === id ? { ...re, ...updates, updated_at: new Date().toISOString() } : re
        )
      })),

      // --- Actions: Workout Logs ---
      startWorkoutLog: (routine_id = null) => {
        const { currentUser } = get();
        const newLog = {
          id: generateUUID(),
          user_id: currentUser.id,
          routine_id,
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
        routineExercises: [],
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
        const routine2Id = generateUUID();
        const routines = [
          { id: routine1Id, name: '상체 (Push & Pull)', user_id: currentUser.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: routine2Id, name: '하체 (Legs)', user_id: currentUser.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ];

        // 2. Create Routine Exercises
        const routineExercises = [
          // 상체
          { id: generateUUID(), routine_id: routine1Id, exercise_id: exMap['벤치프레스'], order: 1, target_sets: 4, target_record: '10', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: generateUUID(), routine_id: routine1Id, exercise_id: exMap['풀업'], order: 2, target_sets: 4, target_record: '8', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: generateUUID(), routine_id: routine1Id, exercise_id: exMap['오버헤드 프레스'], order: 3, target_sets: 3, target_record: '10', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          // 하체
          { id: generateUUID(), routine_id: routine2Id, exercise_id: exMap['스쿼트'], order: 1, target_sets: 5, target_record: '5', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: generateUUID(), routine_id: routine2Id, exercise_id: exMap['데드리프트'], order: 2, target_sets: 3, target_record: '5', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: generateUUID(), routine_id: routine2Id, exercise_id: exMap['레그 익스텐션'], order: 3, target_sets: 3, target_record: '15', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ];

        // 3. Create Workout Logs (Past few weeks)
        const workoutLogs = [];
        const setRecords = [];

        // Helper to add upper body log
        const addUpperLog = (daysAgo, benchWeight, pullupWeight = 0, ohpWeight = 30) => {
          const logId = generateUUID();
          const start = getPastDate(daysAgo);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          workoutLogs.push({
            id: logId, user_id: currentUser.id, routine_id: routine1Id,
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
            id: logId, user_id: currentUser.id, routine_id: routine2Id,
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
            id: logId, user_id: currentUser.id, routine_id: null, // routine_id: null for free workouts
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
          routineExercises,
          workoutLogs,
          setRecords
        });
      }
    }),
    {
      name: 'workout-tracker-storage', // Key for local storage
    }
  )
);
