import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EXERCISE_DICTIONARY } from '../data/exerciseDictionary.js';
import { normalizeMuscleLabel } from '../data/muscleGroups.js';
import { MAX_SESSIONS_PER_ROUTINE } from '../utils/sessionHelper.js';

const generateUUID = () => crypto.randomUUID();

const DEFAULT_EXERCISE_UNITS = {
  '벤치프레스': 'kg',
  '스쿼트': 'kg',
  '데드리프트': 'kg',
  '풀업': 'kg',
  '바벨 로우': 'kg',
  '오버헤드 프레스': 'kg',
  '바벨 컬': 'kg',
  '레그 익스텐션': 'kg',
  '푸시업': 'reps',
  '플랭크': 'sec',
};

const getDefaultExerciseUnit = (name) => DEFAULT_EXERCISE_UNITS[name] || 'kg';

// Default seed exercises with muscle and equipment info
const DEFAULT_EXERCISES = [
  { id: generateUUID(), name: '벤치프레스', primary_muscle: '대흉근', equipment: '바벨', unit: 'kg', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '스쿼트', primary_muscle: '대퇴사두', equipment: '바벨', unit: 'kg', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '데드리프트', primary_muscle: '척추기립근', equipment: '바벨', unit: 'kg', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '풀업', primary_muscle: '광배근', equipment: '맨몸', unit: 'kg', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '바벨 로우', primary_muscle: '광배근', equipment: '바벨', unit: 'kg', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '오버헤드 프레스', primary_muscle: '삼각근', equipment: '바벨', unit: 'kg', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '바벨 컬', primary_muscle: '상완이두근', equipment: '바벨', unit: 'kg', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '레그 익스텐션', primary_muscle: '대퇴사두', equipment: '머신', unit: 'kg', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '푸시업', primary_muscle: '대흉근', equipment: '맨몸', unit: 'reps', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '플랭크', primary_muscle: '복근', equipment: '맨몸', unit: 'sec', user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

function targetExercise(name, target_sets, target_record, rest_between_sets = 90, rest_after_exercise = 120) {
  return {
    name,
    target_sets,
    target_record: String(target_record),
    rest_between_sets,
    rest_after_exercise,
  };
}

const DUMMY_ROUTINE_BLUEPRINTS = [
  {
    name: '파워빌딩 4일 분할',
    sessions: [
      {
        name: '상체 힘',
        exercises: [
          targetExercise('벤치프레스', 5, 5, 180, 180),
          targetExercise('바벨 로우', 5, 6, 150, 150),
          targetExercise('오버헤드 프레스', 4, 5, 150, 150),
          targetExercise('풀업', 4, 6, 120, 120),
          targetExercise('바벨 컬', 3, 10, 75, 90),
        ],
      },
      {
        name: '하체 힘',
        exercises: [
          targetExercise('스쿼트', 5, 5, 180, 210),
          targetExercise('데드리프트', 3, 3, 210, 240),
          targetExercise('레그 익스텐션', 3, 12, 90, 120),
          targetExercise('플랭크', 3, 60, 45, 90),
        ],
      },
      {
        name: '상체 볼륨',
        exercises: [
          targetExercise('덤벨 벤치프레스', 4, 10, 120, 150),
          targetExercise('원암 덤벨 로우', 4, 10, 105, 120),
          targetExercise('덤벨 숄더 프레스', 3, 10, 105, 120),
          targetExercise('사이드 레터럴 레이즈', 4, 15, 60, 90),
          targetExercise('해머 컬', 3, 12, 60, 90),
        ],
      },
      {
        name: '하체 볼륨',
        exercises: [
          targetExercise('고블렛 스쿼트', 4, 12, 120, 150),
          targetExercise('스티프 덤벨 데드리프트', 4, 10, 120, 150),
          targetExercise('덤벨 런지', 3, 12, 90, 120),
          targetExercise('카프 레이즈 덤벨', 4, 15, 60, 90),
          targetExercise('행잉 레그 레이즈', 3, 10, 60, 90),
        ],
      },
    ],
  },
  {
    name: '홈트 컨디셔닝 4일',
    sessions: [
      {
        name: '푸시와 코어',
        exercises: [
          targetExercise('푸시업', 4, 15, 60, 90),
          targetExercise('벤치 딥스', 3, 12, 60, 90),
          targetExercise('플랭크', 3, 75, 45, 75),
          targetExercise('마운틴 클라이머', 4, 30, 45, 90),
        ],
      },
      {
        name: '풀과 자세',
        exercises: [
          targetExercise('인버티드 로우', 4, 10, 75, 90),
          targetExercise('밴드 풀어파트', 4, 18, 45, 60),
          targetExercise('크런치', 3, 20, 45, 60),
          targetExercise('리버스 크런치', 3, 15, 45, 75),
        ],
      },
      {
        name: '하체와 둔근',
        exercises: [
          targetExercise('맨몸 스쿼트', 4, 20, 60, 90),
          targetExercise('맨몸 워킹 런지', 3, 20, 75, 90),
          targetExercise('원레그 힙 브릿지', 3, 12, 60, 75),
          targetExercise('밴드 힙 리프트', 3, 15, 60, 75),
          targetExercise('카프 레이즈 밴드', 3, 20, 45, 75),
        ],
      },
      {
        name: '모빌리티',
        exercises: [
          targetExercise('90/90 햄스트링 스트레칭', 2, 45, 30, 45),
          targetExercise('스탠딩 햄스트링/카프 스트레칭', 2, 45, 30, 45),
          targetExercise('인터미디에이트 힙 플렉서 쿼드 스트레칭', 2, 40, 30, 45),
          targetExercise('엎드려 대퇴사두 스트레칭', 2, 40, 30, 45),
          targetExercise('슈퍼맨 자세', 3, 30, 45, 60),
        ],
      },
    ],
  },
  {
    name: '덤벨 근비대 4일',
    sessions: [
      {
        name: '가슴과 삼두',
        exercises: [
          targetExercise('덤벨 벤치프레스', 4, 8, 120, 150),
          targetExercise('해머그립 인클라인 덤벨 벤치프레스', 4, 10, 105, 120),
          targetExercise('스트레이트암 덤벨 풀오버', 3, 12, 90, 120),
          targetExercise('벤치 딥스', 3, 12, 75, 90),
        ],
      },
      {
        name: '등과 이두',
        exercises: [
          targetExercise('원암 덤벨 로우', 4, 10, 105, 120),
          targetExercise('인버티드 로우', 4, 10, 75, 90),
          targetExercise('덤벨 컬', 3, 12, 60, 75),
          targetExercise('해머 컬', 3, 12, 60, 75),
        ],
      },
      {
        name: '하체 덤벨',
        exercises: [
          targetExercise('고블렛 스쿼트', 4, 12, 105, 135),
          targetExercise('덤벨 런지', 4, 10, 90, 120),
          targetExercise('스티프 덤벨 데드리프트', 4, 10, 105, 135),
          targetExercise('카프 레이즈 덤벨', 4, 15, 60, 90),
        ],
      },
      {
        name: '어깨와 복근',
        exercises: [
          targetExercise('덤벨 숄더 프레스', 4, 8, 120, 135),
          targetExercise('아놀드 덤벨 프레스', 3, 10, 90, 105),
          targetExercise('사이드 레터럴 레이즈', 4, 15, 60, 75),
          targetExercise('행잉 레그 레이즈', 3, 12, 60, 75),
          targetExercise('앱 롤러', 3, 10, 75, 90),
        ],
      },
    ],
  },
  {
    name: '컨디셔닝과 회복 루틴',
    sessions: [
      {
        name: '엔진과 코어',
        exercises: [
          targetExercise('에어 바이크', 5, 40, 45, 90),
          targetExercise('바이시클링', 4, 60, 45, 90),
          targetExercise('마운틴 클라이머', 4, 30, 45, 75),
          targetExercise('플랭크', 3, 60, 45, 75),
        ],
      },
      {
        name: '케틀벨 파워',
        exercises: [
          targetExercise('원암 케틀벨 스윙', 5, 12, 90, 120),
          targetExercise('케틀벨 스모 하이풀', 4, 10, 90, 120),
          targetExercise('고블렛 스쿼트', 4, 12, 90, 120),
          targetExercise('원암 덤벨 로우', 3, 12, 75, 90),
        ],
      },
      {
        name: '후면 사슬',
        exercises: [
          targetExercise('트랩바 데드리프트', 4, 5, 150, 180),
          targetExercise('백 익스텐션', 3, 15, 75, 90),
          targetExercise('밴드 힙 익스텐션', 3, 15, 60, 75),
          targetExercise('슈퍼맨 자세', 3, 30, 45, 75),
        ],
      },
      {
        name: '회복 스트레치',
        exercises: [
          targetExercise('스탠딩 햄스트링/카프 스트레칭', 2, 60, 30, 45),
          targetExercise('90/90 햄스트링 스트레칭', 2, 60, 30, 45),
          targetExercise('엎드려 대퇴사두 스트레칭', 2, 45, 30, 45),
          targetExercise('크런치', 3, 18, 45, 60),
          targetExercise('플랭크', 2, 90, 45, 75),
        ],
      },
    ],
  },
];

const DUMMY_LOAD_PROFILES = {
  '벤치프레스': { base: 72.5, step: 2.5 },
  '스쿼트': { base: 95, step: 5 },
  '데드리프트': { base: 125, step: 5 },
  '풀업': { base: 2.5, step: 1.25 },
  '바벨 로우': { base: 67.5, step: 2.5 },
  '오버헤드 프레스': { base: 45, step: 2.5 },
  '바벨 컬': { base: 25, step: 1.25 },
  '레그 익스텐션': { base: 55, step: 2.5 },
  '덤벨 벤치프레스': { base: 24, step: 1 },
  '원암 덤벨 로우': { base: 28, step: 1 },
  '덤벨 숄더 프레스': { base: 18, step: 1 },
  '사이드 레터럴 레이즈': { base: 8, step: 0.5 },
  '해머 컬': { base: 12, step: 0.5 },
  '고블렛 스쿼트': { base: 28, step: 2 },
  '스티프 덤벨 데드리프트': { base: 26, step: 1 },
  '덤벨 런지': { base: 14, step: 1 },
  '카프 레이즈 덤벨': { base: 18, step: 1 },
  '해머그립 인클라인 덤벨 벤치프레스': { base: 20, step: 1 },
  '스트레이트암 덤벨 풀오버': { base: 18, step: 1 },
  '덤벨 컬': { base: 11, step: 0.5 },
  '아놀드 덤벨 프레스': { base: 14, step: 1 },
  '앱 롤러': { base: 0, step: 0, bodyweight: true },
  '원암 케틀벨 스윙': { base: 16, step: 2 },
  '케틀벨 스모 하이풀': { base: 18, step: 2 },
  '트랩바 데드리프트': { base: 120, step: 5 },
  '백 익스텐션': { base: 0, step: 0, bodyweight: true },
  '밴드 힙 익스텐션': { base: 0, step: 0, bodyweight: true },
  '벤치 딥스': { base: 0, step: 0, bodyweight: true },
  '인버티드 로우': { base: 0, step: 0, bodyweight: true },
  '밴드 풀어파트': { base: 0, step: 0, bodyweight: true },
  '맨몸 워킹 런지': { base: 0, step: 0, bodyweight: true },
  '밴드 힙 리프트': { base: 0, step: 0, bodyweight: true },
  '카프 레이즈 밴드': { base: 0, step: 0, bodyweight: true },
};

const DUMMY_LOG_ROTATIONS = [
  { routineName: '파워빌딩 4일 분할', startDaysAgo: 56, spacingDays: 2, cycles: 3, startHour: 19, baseIntensity: -1 },
  { routineName: '홈트 컨디셔닝 4일', startDaysAgo: 37, spacingDays: 2, cycles: 2, startHour: 7, baseIntensity: 0 },
  { routineName: '덤벨 근비대 4일', startDaysAgo: 24, spacingDays: 2, cycles: 2, startHour: 20, baseIntensity: 0 },
  { routineName: '컨디셔닝과 회복 루틴', startDaysAgo: 14, spacingDays: 2, cycles: 2, startHour: 18, baseIntensity: -0.5 },
];

const DUMMY_FREE_WORKOUTS = [
  {
    daysAgo: 43,
    startHour: 21,
    durationMin: 18,
    groups: [
      { name: '플랭크', sets: [{ record: 45, memo: '출장지 호텔방' }, { record: 40 }] },
      { name: '푸시업', sets: [{ record: 20 }, { record: 18, memo: '가볍게 펌핑' }] },
    ],
  },
  {
    daysAgo: 17,
    startHour: 6,
    durationMin: 24,
    groups: [
      { name: '90/90 햄스트링 스트레칭', sets: [{ record: 60, memo: '좌우 각각' }, { record: 60 }] },
      { name: '스탠딩 햄스트링/카프 스트레칭', sets: [{ record: 50 }, { record: 50 }] },
      { name: '슈퍼맨 자세', sets: [{ record: 30 }, { record: 30, memo: '허리 불편 없음' }] },
    ],
  },
  {
    daysAgo: 5,
    startHour: 12,
    durationMin: 28,
    groups: [
      { name: '에어 바이크', sets: [{ record: 50 }, { record: 48 }, { record: 45, memo: '숨이 많이 참' }] },
      { name: '마운틴 클라이머', sets: [{ record: 35 }, { record: 32 }] },
      { name: '크런치', sets: [{ record: 25 }, { record: 22 }] },
    ],
  },
];

function getDummyRequiredExerciseNames() {
  return [
    ...new Set([
      ...DUMMY_ROUTINE_BLUEPRINTS.flatMap((routine) =>
        routine.sessions.flatMap((session) => session.exercises.map((exercise) => exercise.name)),
      ),
      ...DUMMY_FREE_WORKOUTS.flatMap((workout) => workout.groups.map((group) => group.name)),
    ]),
  ];
}

function normalizeExerciseName(name) {
  return name.trim().toLowerCase();
}

function dictionaryExerciseToStoreExercise(dictionaryExercise, timestamp) {
  return {
    id: generateUUID(),
    name: dictionaryExercise.name,
    englishName: dictionaryExercise.englishName || null,
    primary_muscle: normalizeMuscleLabel(dictionaryExercise.primaryMuscle) || '기타',
    secondaryMuscles: dictionaryExercise.secondaryMuscles || [],
    equipment: dictionaryExercise.equipment || '기타',
    category: dictionaryExercise.category || 'strength',
    unit: dictionaryExercise.unit || getDefaultExerciseUnit(dictionaryExercise.name),
    synonyms: dictionaryExercise.synonyms || [],
    user_id: dictionaryExercise.user_id ?? null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

function ensureDummyExercises(existingExercises, timestamp) {
  const exercises = existingExercises.length > 0 ? [...existingExercises] : [...DEFAULT_EXERCISES];
  const exercisesByName = new Map(exercises.map((exercise) => [normalizeExerciseName(exercise.name), exercise]));
  const dictionaryByName = new Map(EXERCISE_DICTIONARY.map((exercise) => [normalizeExerciseName(exercise.name), exercise]));

  getDummyRequiredExerciseNames().forEach((name) => {
    const key = normalizeExerciseName(name);
    if (exercisesByName.has(key)) return;

    const dictionaryExercise = dictionaryByName.get(key);
    if (!dictionaryExercise) {
      throw new Error(`더미 데이터 운동을 찾을 수 없습니다: ${name}`);
    }

    const exercise = dictionaryExerciseToStoreExercise(dictionaryExercise, timestamp);
    exercises.push(exercise);
    exercisesByName.set(key, exercise);
  });

  return { exercises, exercisesByName };
}

function getPastDate(daysAgo, hour = 19, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function roundTrainingWeight(value) {
  return Math.round(value * 2) / 2;
}

function buildSetRecordMemo({ exercise, setNumber, targetSets, isWarmup, isCompleted, completionMode, intensity }) {
  if (!isCompleted) {
    return completionMode === 'in-progress' ? '진행 중, 아직 입력 전' : '시간 부족으로 미완료';
  }

  if (isWarmup) return '워밍업';
  if (completionMode === 'deload' && setNumber === 1) return '디로드 주간';
  if (exercise.unit === 'sec' && setNumber === 1) return '호흡 길게';
  if (intensity >= 1.5 && setNumber === targetSets && exercise.unit === 'kg') return '다음 주 소폭 증량';
  return null;
}

function createSetRecordsForExercise({
  logId,
  exercise,
  link,
  timestamp,
  intensity,
  completionMode,
  exerciseIndex,
}) {
  const targetSets = Number(link.target_sets) || 3;
  const targetRecord = Number(link.target_record) || 10;
  const profile = DUMMY_LOAD_PROFILES[exercise.name] || {};
  const isBodyweight = Boolean(profile.bodyweight) || exercise.unit !== 'kg';
  const workingWeight = isBodyweight
    ? 0
    : roundTrainingWeight(Math.max(0, (profile.base ?? 20) + intensity * (profile.step ?? 1)));

  return Array.from({ length: targetSets }, (_, index) => {
    const setNumber = index + 1;
    const isWarmup = !isBodyweight && targetSets >= 4 && setNumber === 1;
    const isIncompleteTail = completionMode === 'partial' && setNumber === targetSets && exerciseIndex >= 2;
    const isInProgressTail = completionMode === 'in-progress' && (exerciseIndex >= 2 || (exerciseIndex === 1 && setNumber > 2));
    const isCompleted = !(isIncompleteTail || isInProgressTail);

    let weight = 0;
    if (!isBodyweight) {
      const topSetBump = setNumber === targetSets && targetRecord <= 6 ? 2.5 : 0;
      weight = roundTrainingWeight(isWarmup ? workingWeight * 0.72 : workingWeight + topSetBump);
    }

    let record;
    if (exercise.unit === 'sec') {
      record = Math.max(15, targetRecord + Math.round(intensity * 5) - index * 5);
    } else if (isBodyweight) {
      record = Math.max(1, targetRecord + Math.floor(intensity) - (index === targetSets - 1 ? 1 : 0));
    } else {
      record = Math.max(1, targetRecord + (isWarmup ? 3 : 0) - (index === targetSets - 1 && intensity < 0 ? 1 : 0));
    }

    const memo = buildSetRecordMemo({
      exercise,
      setNumber,
      targetSets,
      isWarmup,
      isCompleted,
      completionMode,
      intensity,
    });

    return {
      id: generateUUID(),
      workout_log_id: logId,
      exercise_id: exercise.id,
      set_number: setNumber,
      weight,
      record: String(record),
      is_completed: isCompleted,
      memo,
      created_at: timestamp,
      updated_at: timestamp,
    };
  });
}

function createDummyWorkoutData({ userId, existingExercises }) {
  const nowIso = new Date().toISOString();
  const { exercises, exercisesByName } = ensureDummyExercises(existingExercises, nowIso);
  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const routines = [];
  const sessions = [];
  const sessionExercises = [];
  const workoutLogs = [];
  const setRecords = [];
  const sessionEntriesByKey = new Map();

  DUMMY_ROUTINE_BLUEPRINTS.forEach((routineBlueprint, routineIndex) => {
    const routineCreatedAt = getPastDate(72 - routineIndex * 6, 9, 0).toISOString();
    const routineId = generateUUID();
    routines.push({
      id: routineId,
      name: routineBlueprint.name,
      user_id: userId,
      created_at: routineCreatedAt,
      updated_at: nowIso,
    });

    routineBlueprint.sessions.forEach((sessionBlueprint, sessionIndex) => {
      const sessionCreatedAt = getPastDate(71 - routineIndex * 6 - sessionIndex, 10, 0).toISOString();
      const sessionId = generateUUID();
      const session = {
        id: sessionId,
        name: sessionBlueprint.name,
        routine_id: routineId,
        session_order: sessionIndex + 1,
        user_id: userId,
        created_at: sessionCreatedAt,
        updated_at: nowIso,
      };
      sessions.push(session);
      sessionEntriesByKey.set(`${routineBlueprint.name}:${sessionBlueprint.name}`, {
        session,
        blueprint: sessionBlueprint,
      });

      sessionBlueprint.exercises.forEach((exerciseTarget, exerciseIndex) => {
        const exercise = exercisesByName.get(normalizeExerciseName(exerciseTarget.name));
        sessionExercises.push({
          id: generateUUID(),
          session_id: sessionId,
          exercise_id: exercise.id,
          order: exerciseIndex + 1,
          target_sets: exerciseTarget.target_sets,
          target_record: exerciseTarget.target_record,
          rest_between_sets: exerciseTarget.rest_between_sets,
          rest_after_exercise: exerciseTarget.rest_after_exercise,
          created_at: sessionCreatedAt,
          updated_at: nowIso,
        });
      });
    });
  });

  const addSessionWorkoutLog = ({ routineName, sessionName, daysAgo, startHour, startMinute = 0, durationMin, intensity, completionMode = 'done' }) => {
    const entry = sessionEntriesByKey.get(`${routineName}:${sessionName}`);
    if (!entry) return;

    const start = getPastDate(daysAgo, startHour, startMinute);
    const end = completionMode === 'in-progress' ? null : addMinutes(start, durationMin);
    const timestamp = start.toISOString();
    const logId = generateUUID();
    const links = sessionExercises
      .filter((link) => link.session_id === entry.session.id)
      .sort((a, b) => a.order - b.order);

    workoutLogs.push({
      id: logId,
      user_id: userId,
      session_id: entry.session.id,
      start_time: timestamp,
      end_time: end ? end.toISOString() : null,
      created_at: timestamp,
      updated_at: (end || start).toISOString(),
    });

    links.forEach((link, exerciseIndex) => {
      const exercise = exercisesById.get(link.exercise_id);
      if (!exercise) return;
      setRecords.push(
        ...createSetRecordsForExercise({
          logId,
          exercise,
          link,
          timestamp,
          intensity,
          completionMode,
          exerciseIndex,
        }),
      );
    });
  };

  DUMMY_LOG_ROTATIONS.forEach((rotation) => {
    const routine = DUMMY_ROUTINE_BLUEPRINTS.find((item) => item.name === rotation.routineName);
    if (!routine) return;

    for (let cycle = 0; cycle < rotation.cycles; cycle += 1) {
      routine.sessions.forEach((sessionBlueprint, sessionIndex) => {
        const daysAgo = rotation.startDaysAgo - (cycle * routine.sessions.length + sessionIndex) * rotation.spacingDays;
        const isDeload = rotation.routineName === '파워빌딩 4일 분할' && cycle === 1 && sessionIndex === 1;
        const isPartial = rotation.routineName === '덤벨 근비대 4일' && cycle === 1 && sessionIndex === 2;
        const isInProgress = rotation.routineName === '컨디셔닝과 회복 루틴' && cycle === 1 && sessionIndex === 3;
        const completionMode = isInProgress ? 'in-progress' : isPartial ? 'partial' : isDeload ? 'deload' : 'done';
        const intensity = rotation.baseIntensity + cycle * 0.75 + (sessionIndex % 2 === 0 ? 0.25 : 0) - (isDeload ? 1.25 : 0);
        const durationMin = 42 + sessionBlueprint.exercises.length * 7 + (rotation.routineName.includes('파워빌딩') ? 18 : 0);

        addSessionWorkoutLog({
          routineName: rotation.routineName,
          sessionName: sessionBlueprint.name,
          daysAgo,
          startHour: rotation.startHour,
          startMinute: sessionIndex * 7,
          durationMin,
          intensity,
          completionMode,
        });
      });
    }
  });

  DUMMY_FREE_WORKOUTS.forEach((workout) => {
    const start = getPastDate(workout.daysAgo, workout.startHour, 10);
    const end = addMinutes(start, workout.durationMin);
    const timestamp = start.toISOString();
    const logId = generateUUID();

    workoutLogs.push({
      id: logId,
      user_id: userId,
      session_id: null,
      start_time: timestamp,
      end_time: end.toISOString(),
      created_at: timestamp,
      updated_at: end.toISOString(),
    });

    workout.groups.forEach((group) => {
      const exercise = exercisesByName.get(normalizeExerciseName(group.name));
      if (!exercise) return;

      group.sets.forEach((set, index) => {
        setRecords.push({
          id: generateUUID(),
          workout_log_id: logId,
          exercise_id: exercise.id,
          set_number: index + 1,
          weight: set.weight ?? 0,
          record: String(set.record),
          is_completed: set.is_completed ?? true,
          memo: set.memo || null,
          created_at: timestamp,
          updated_at: end.toISOString(),
        });
      });
    });
  });

  return {
    exercises,
    routines,
    sessions,
    sessionExercises,
    workoutLogs,
    setRecords,
  };
}

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
          primary_muscle: normalizeMuscleLabel(muscle) || '기타',
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
      version: 4,
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

        return newState;
      }
    }
  )
);
