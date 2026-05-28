import { EXERCISE_DICTIONARY } from './exerciseDictionary.js';
import { normalizeMuscleLabel } from './muscleGroups.js';

export const generateUUID = () => crypto.randomUUID();

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
export const DEFAULT_EXERCISES = [
  { id: generateUUID(), name: '벤치프레스', primary_muscle: '대흉근', equipment: '바벨', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '스쿼트', primary_muscle: '대퇴사두', equipment: '바벨', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '데드리프트', primary_muscle: '척추기립근', equipment: '바벨', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '풀업', primary_muscle: '광배근', equipment: '맨몸', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '바벨 로우', primary_muscle: '광배근', equipment: '바벨', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '오버헤드 프레스', primary_muscle: '삼각근', equipment: '바벨', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '바벨 컬', primary_muscle: '상완이두근', equipment: '바벨', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '레그 익스텐션', primary_muscle: '대퇴사두', equipment: '머신', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '푸시업', primary_muscle: '대흉근', equipment: '맨몸', unit: 'reps', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: generateUUID(), name: '플랭크', primary_muscle: '복근', equipment: '맨몸', unit: 'sec', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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
    is_unilateral: dictionaryExercise.is_unilateral ?? false,
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

function buildSetRecordMemo({ exercise, setNumber, targetSets, isWarmup, completionMode, intensity }) {
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
}) {
  const targetSets = Number(link.target_sets) || 3;
  const targetRecord = Number(link.target_record) || 10;
  const profile = DUMMY_LOAD_PROFILES[exercise.name] || {};
  const isBodyweight = Boolean(profile.bodyweight) || exercise.unit !== 'kg';
  const workingWeight = isBodyweight
    ? 0
    : roundTrainingWeight(Math.max(0, (profile.base ?? 20) + intensity * (profile.step ?? 1)));

  const isUnilateral = exercise.is_unilateral ?? false;
  const records = [];

  for (let index = 0; index < targetSets; index++) {
    const setNumber = index + 1;
    const isWarmup = !isBodyweight && targetSets >= 4 && setNumber === 1;

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
      completionMode,
      intensity,
    });

    if (isUnilateral) {
      records.push({
        id: generateUUID(),
        workout_log_id: logId,
        exercise_id: exercise.id,
        set_number: setNumber,
        weight,
        record: String(record),
        side: 'L',
        memo,
        created_at: timestamp,
        updated_at: timestamp,
      });
      records.push({
        id: generateUUID(),
        workout_log_id: logId,
        exercise_id: exercise.id,
        set_number: setNumber,
        weight,
        record: String(record),
        side: 'R',
        memo,
        created_at: timestamp,
        updated_at: timestamp,
      });
    } else {
      records.push({
        id: generateUUID(),
        workout_log_id: logId,
        exercise_id: exercise.id,
        set_number: setNumber,
        weight,
        record: String(record),
        side: 'both',
        memo,
        created_at: timestamp,
        updated_at: timestamp,
      });
    }
  }

  return records;
}

export function createDummyWorkoutData({ userId, existingExercises }) {
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

    links.forEach((link) => {
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
          side: 'both',
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
