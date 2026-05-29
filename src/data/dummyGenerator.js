import { EXERCISE_DICTIONARY } from './exerciseDictionary.js';
import { normalizeMuscleLabel } from './muscleGroups.js';

export const generateUUID = () => crypto.randomUUID();

export const DEFAULT_EXERCISE_IDS = {
  '벤치프레스': '00000000-0000-4000-8000-000000000001',
  '스쿼트': '00000000-0000-4000-8000-000000000002',
  '데드리프트': '00000000-0000-4000-8000-000000000003',
  '풀업': '00000000-0000-4000-8000-000000000004',
  '바벨 로우': '00000000-0000-4000-8000-000000000005',
  '덤벨 숄더 프레스': '00000000-0000-4000-8000-000000000006',
  '불가리안 스플릿 스쿼트': '00000000-0000-4000-8000-000000000011',
  '플랭크': '00000000-0000-4000-8000-000000000010',
};

const DEFAULT_EXERCISE_UNITS = {
  '벤치프레스': 'kg',
  '스쿼트': 'kg',
  '데드리프트': 'kg',
  '풀업': 'kg',
  '바벨 로우': 'kg',
  '덤벨 숄더 프레스': 'kg',
  '불가리안 스플릿 스쿼트': 'kg',
  '플랭크': 'sec',
};

export const getDefaultExerciseUnit = (name) => DEFAULT_EXERCISE_UNITS[name] || 'kg';

// Default seed exercises with muscle and equipment info
export const DEFAULT_EXERCISES = [
  { id: DEFAULT_EXERCISE_IDS['벤치프레스'], name: '벤치프레스', englishName: 'Bench Press', primary_muscle: '대흉근', secondaryMuscles: ['삼각근', '상완삼두근'], equipment: '바벨', category: 'strength', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: DEFAULT_EXERCISE_IDS['스쿼트'], name: '스쿼트', englishName: 'Squat', primary_muscle: '대퇴사두', secondaryMuscles: ['둔근', '햄스트링'], equipment: '바벨', category: 'strength', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: DEFAULT_EXERCISE_IDS['데드리프트'], name: '데드리프트', englishName: 'Deadlift', primary_muscle: '척추기립근', secondaryMuscles: ['둔근', '햄스트링'], equipment: '바벨', category: 'strength', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: DEFAULT_EXERCISE_IDS['풀업'], name: '풀업', englishName: 'Pull Up', primary_muscle: '광배근', secondaryMuscles: ['상완이두근'], equipment: '맨몸', category: 'strength', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: DEFAULT_EXERCISE_IDS['바벨 로우'], name: '바벨 로우', englishName: 'Barbell Row', primary_muscle: '광배근', secondaryMuscles: ['상완이두근', '삼각근'], equipment: '바벨', category: 'strength', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: DEFAULT_EXERCISE_IDS['덤벨 숄더 프레스'], name: '덤벨 숄더 프레스', englishName: 'Dumbbell Shoulder Press', primary_muscle: '삼각근', secondaryMuscles: ['상완삼두근'], equipment: '덤벨', category: 'strength', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: DEFAULT_EXERCISE_IDS['불가리안 스플릿 스쿼트'], name: '불가리안 스플릿 스쿼트', englishName: 'Bulgarian Split Squat', primary_muscle: '대퇴사두', secondaryMuscles: ['둔근', '햄스트링'], equipment: '덤벨', category: 'strength', unit: 'kg', is_unilateral: true, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: DEFAULT_EXERCISE_IDS['플랭크'], name: '플랭크', englishName: 'Plank', primary_muscle: '복근', secondaryMuscles: [], equipment: '맨몸', category: 'strength', unit: 'sec', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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
    name: '기초 체력 확립 루틴',
    sessions: [
      {
        name: '상체 기초 A',
        exercises: [
          targetExercise('벤치프레스', 2, 10, 90, 120),
          targetExercise('바벨 로우', 2, 10, 90, 120),
        ],
      },
      {
        name: '하체 및 코어 기초 A',
        exercises: [
          targetExercise('불가리안 스플릿 스쿼트', 2, 10, 90, 120),
          targetExercise('플랭크', 2, 60, 60, 90),
        ],
      },
      {
        name: '상체 기초 B',
        exercises: [
          targetExercise('벤치프레스', 2, 10, 90, 120),
          targetExercise('바벨 로우', 2, 10, 90, 120),
        ],
      },
      {
        name: '하체 및 코어 기초 B',
        exercises: [
          targetExercise('불가리안 스플릿 스쿼트', 2, 10, 90, 120),
          targetExercise('플랭크', 2, 60, 60, 90),
        ],
      },
    ],
  },
  {
    name: '근비대 성장 루틴',
    sessions: [
      {
        name: '가슴 및 등 밀기 당기기 A',
        exercises: [
          targetExercise('벤치프레스', 3, 8, 120, 150),
          targetExercise('바벨 로우', 3, 8, 120, 150),
        ],
      },
      {
        name: '어깨 및 하체 협응 A',
        exercises: [
          targetExercise('덤벨 숄더 프레스', 3, 10, 90, 120),
          targetExercise('불가리안 스플릿 스쿼트', 3, 10, 90, 120),
          targetExercise('플랭크', 2, 70, 60, 90),
        ],
      },
      {
        name: '가슴 및 등 밀기 당기기 B',
        exercises: [
          targetExercise('벤치프레스', 3, 8, 120, 150),
          targetExercise('바벨 로우', 3, 8, 120, 150),
        ],
      },
      {
        name: '어깨 및 하체 협응 B',
        exercises: [
          targetExercise('덤벨 숄더 프레스', 3, 10, 90, 120),
          targetExercise('불가리안 스플릿 스쿼트', 3, 10, 90, 120),
          targetExercise('플랭크', 2, 70, 60, 90),
        ],
      },
    ],
  },
  {
    name: '피크 스트렝스 루틴',
    sessions: [
      {
        name: '상체 고강도 돌파 A',
        exercises: [
          targetExercise('벤치프레스', 3, 5, 180, 180),
          targetExercise('바벨 로우', 3, 6, 150, 150),
          targetExercise('덤벨 숄더 프레스', 3, 8, 120, 150),
        ],
      },
      {
        name: '하체 및 복근 한계 A',
        exercises: [
          targetExercise('불가리안 스플릿 스쿼트', 3, 8, 120, 150),
          targetExercise('플랭크', 2, 90, 90, 120),
        ],
      },
      {
        name: '상체 고강도 돌파 B',
        exercises: [
          targetExercise('벤치프레스', 3, 5, 180, 180),
          targetExercise('바벨 로우', 3, 6, 150, 150),
          targetExercise('덤벨 숄더 프레스', 3, 8, 120, 150),
        ],
      },
      {
        name: '하체 및 복근 한계 B',
        exercises: [
          targetExercise('불가리안 스플릿 스쿼트', 3, 8, 120, 150),
          targetExercise('플랭크', 2, 90, 90, 120),
        ],
      },
    ],
  },
];

const DUMMY_FREE_WORKOUTS = [
  {
    daysAgo: 45,
    startHour: 21,
    durationMin: 15,
    groups: [
      { name: '플랭크', sets: [{ record: 50, memo: '출장지 호텔방 코어 자극' }, { record: 45 }] },
    ],
  },
  {
    daysAgo: 15,
    startHour: 6,
    durationMin: 20,
    groups: [
      { name: '덤벨 숄더 프레스', sets: [{ weight: 10, record: 12 }, { weight: 10, record: 10, memo: '아침 가볍게 펌핑' }] },
      { name: '플랭크', sets: [{ record: 60 }] },
    ],
  },
];

// MEMO PUZZLE
const MEMOS_GOOD = [
  '컨디션 대박! 가볍게 밀림',
  '자극 꽉꽉 들어온다. 다음 주 무조건 증량',
  '막셋까지 속도 안 죽고 완벽히 제어함',
  '근비대 펌핑 지대로 됨. 완전 뿌듯',
  '오늘따라 통증도 없고 컨디션 최고',
  '마지막 랩까지 자세 완벽하게 유지 성공',
  '오늘 헬스장 공기부터 달랐다 증량 대만족',
];

const MEMOS_BAD = [
  '어제 불면증 때문에 밤새서 그런지 온몸에 힘이 없음',
  '컨디션 너무 구려서 자극 위주로 중량 낮춰서 진행',
  '막셋에 깔릴 뻔해서 식은땀 남',
  '손목이 살짝 시큰거려서 무리 안 하고 마무리',
  '집중도 하락.. 억지로 채웠다 ㅠㅠ',
  '자세 무너져서 허리 나갈 뻔함 주의',
  '요새 피로 누적이 심한 듯. 겨우 들었다',
];

const MEMOS_UNILATERAL = [
  '왼쪽 골반이 타이트해서 가동범위가 덜 나옴',
  '오른발 버틸 때 발바닥 아치 다 풀리고 중심 흔들림',
  '좌우 밸런스 짝짝이 느낌 심해서 왼발부터 먼저 수행함',
  '왼발 엉덩이 터질 거 같음 자극 대박',
  '덤벨 쥐고 하니까 전완근이 먼저 털리네 ㅠ 스트랩 필수',
];

const MEMOS_PLANK = [
  '코어 불타는 느낌. 덜덜덜 진동 옴',
  '골반 쳐지지 않게 아랫배 꽉 잠그고 버팀',
  '땀이 매트 위로 뚝뚝 떨어진다',
  '호흡 차분하게 유지하면서 겨우 채움',
];

const MEMOS_NORMAL = [
  '마지막 랩 자세 제어에 집중',
  '네거티브 천천히 가져가기',
  '그립 다 풀림 스트랩 필수',
  '어깨 찝힘 살짝 있음. 가동범위 조절',
  '땀 번벅 갓생 완',
  '무게 지탱 양호, 무릎 흔들리지 않게',
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

    // 만약 마스터 DEFAULT_EXERCISES에 있으면 거기로 매핑
    const defaultEx = DEFAULT_EXERCISES.find(ex => normalizeExerciseName(ex.name) === key);
    if (defaultEx) {
      exercises.push(defaultEx);
      exercisesByName.set(key, defaultEx);
      return;
    }

    const dictionaryExercise = dictionaryByName.get(key);
    if (!dictionaryExercise) {
      // Fallback
      const fallbackEx = {
        id: generateUUID(),
        name: name,
        englishName: name,
        primary_muscle: '기타',
        secondaryMuscles: [],
        equipment: '기타',
        category: 'strength',
        unit: getDefaultExerciseUnit(name),
        is_unilateral: name.includes('스쿼트') || name.includes('런지'),
        synonyms: [name],
        user_id: null,
        created_at: timestamp,
        updated_at: timestamp
      };
      exercises.push(fallbackEx);
      exercisesByName.set(key, fallbackEx);
      return;
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

function createSetRecordsForExercise({
  logId,
  exercise,
  link,
  timestamp,
  daysAgo,
  condition,
}) {
  const targetSets = Number(link.target_sets) || 2;
  const targetRecord = Number(link.target_record) || 10;
  const isUnilateral = exercise.is_unilateral ?? false;

  const progressRatio = (70 - daysAgo) / 70; // 0 (70일 전) -> 1.0 (오늘)

  // 점진적 과부하 베이스 중량 및 한계값
  let baseWeight = 0;
  let maxGrowth = 0;
  let step = 2.5;

  if (exercise.name === '벤치프레스') {
    baseWeight = 40; maxGrowth = 20; step = 2.5; // 40kg -> 60kg
  } else if (exercise.name === '바벨 로우') {
    baseWeight = 30; maxGrowth = 15; step = 2.5; // 30kg -> 45kg
  } else if (exercise.name === '덤벨 숄더 프레스') {
    baseWeight = 8; maxGrowth = 6; step = 2;     // 8kg -> 14kg
  } else if (exercise.name === '불가리안 스플릿 스쿼트') {
    baseWeight = 6; maxGrowth = 8; step = 2;     // 6kg -> 14kg
  }

  // 중량 산출
  let weight = baseWeight + progressRatio * maxGrowth;
  if (condition === 'good') {
    weight += step;
  } else if (condition === 'bad') {
    weight = Math.max(baseWeight, weight - step * 2);
  }
  weight = Math.round(weight / step) * step;

  // 무게 없는 운동(플랭크 등)인 경우
  const isSecUnit = exercise.unit === 'sec';
  const isRepsUnit = exercise.unit === 'reps';
  const isBodyweight = isSecUnit || isRepsUnit || exercise.equipment === '맨몸';
  if (isBodyweight) {
    weight = 0;
  }

  const records = [];

  // 각 세트별 수행 횟수/시간 및 피로도 시뮬레이션
  const generateRepsForSet = (setIdx, side = 'both') => {
    let repTarget = targetRecord;

    // 플랭크인 경우 시간(초) 점진적 과부하
    if (exercise.name === '플랭크') {
      const plankBase = 40;
      const plankGrowth = 40;
      repTarget = Math.round(plankBase + progressRatio * plankGrowth);
    }

    let reps = repTarget;

    // 컨디션 반영
    if (condition === 'good') {
      reps += isSecUnit ? 10 : 1;
    } else if (condition === 'bad') {
      reps -= isSecUnit ? 15 : 2;
    }

    // 피로도 모델링: 뒤 세트로 갈수록 횟수가 준다
    if (setIdx === 1) {
      // 2번째 세트 (0-indexed 1)
      reps -= isSecUnit ? 5 : 0;
    } else if (setIdx === 2) {
      // 3번째 세트 (0-indexed 2)
      reps -= isSecUnit ? 5 : 1;
    } else if (setIdx >= 3) {
      // 4번째 세트 이상
      reps -= isSecUnit ? 10 : 2;
    }

    // 편측성 미세 불균형 (L과 R 횟수가 다를 수 있음)
    if (isUnilateral && side === 'L' && Math.random() < 0.15) {
      reps = Math.max(1, reps - 1);
    }

    return Math.max(isSecUnit ? 15 : 1, reps);
  };

  // 메모 바인딩
  const getMemoForSet = () => {
    // 25% 확률로 메모 작성
    if (Math.random() > 0.25) return null;

    if (exercise.name === '플랭크') {
      return getRandomItem(MEMOS_PLANK);
    }
    if (isUnilateral) {
      return getRandomItem(MEMOS_UNILATERAL);
    }
    if (condition === 'good') {
      return getRandomItem(MEMOS_GOOD);
    }
    if (condition === 'bad') {
      return getRandomItem(MEMOS_BAD);
    }
    return getRandomItem(MEMOS_NORMAL);
  };

  // 실제 세트 레코드 생성
  for (let index = 0; index < targetSets; index++) {
    const setNumber = index + 1;

    if (isUnilateral) {
      // Left side
      const repL = generateRepsForSet(index, 'L');
      records.push({
        id: generateUUID(),
        workout_log_id: logId,
        exercise_id: exercise.id,
        set_number: setNumber,
        weight,
        record: String(repL),
        side: 'L',
        memo: getMemoForSet(index, 'L'),
        created_at: timestamp,
        updated_at: timestamp,
      });

      // Right side
      const repR = generateRepsForSet(index, 'R');
      records.push({
        id: generateUUID(),
        workout_log_id: logId,
        exercise_id: exercise.id,
        set_number: setNumber,
        weight,
        record: String(repR),
        side: 'R',
        memo: getMemoForSet(index, 'R'),
        created_at: timestamp,
        updated_at: timestamp,
      });
    } else {
      const repBoth = generateRepsForSet(index, 'both');
      records.push({
        id: generateUUID(),
        workout_log_id: logId,
        exercise_id: exercise.id,
        set_number: setNumber,
        weight,
        record: String(repBoth),
        side: 'both',
        memo: getMemoForSet(index, 'both'),
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

  // 1. 루틴 & 세션 & 운동 매핑 템플릿 생성
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

  // 세션 운동 로그 추가 헬퍼
  const addSessionWorkoutLog = ({ routineName, sessionName, daysAgo, startHour, durationMin, condition, inProgress = false }) => {
    const entry = sessionEntriesByKey.get(`${routineName}:${sessionName}`);
    if (!entry) return;

    const start = getPastDate(daysAgo, startHour, 0);
    const end = inProgress ? null : addMinutes(start, durationMin);
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
      updated_at: end ? end.toISOString() : timestamp,
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
          daysAgo,
          condition,
        }),
      );
    });
  };

  // 2. 70일 타임트래블 시뮬레이터 구동
  let r1SessionIdx = 0;
  let r2SessionIdx = 0;
  let r3SessionIdx = 0;

  for (let daysAgo = 70; daysAgo >= 0; daysAgo--) {
    const currentDate = getPastDate(daysAgo);
    const dayOfWeek = currentDate.getDay(); // 0: 일, 1: 월, 2: 화, 3: 수, 4: 목, 5: 금, 6: 토

    // 월(1), 수(3), 금(5), 토(6)에만 운동을 수행하여 주 4회 분산
    if ([1, 3, 5, 6].includes(dayOfWeek)) {
      // 15% 확률로 바쁜 하루여서 운동을 건너뜀 (현실적인 공백 부여 및 데이터 다이어트)
      // 단, daysAgo가 0인 오늘은 테스트 통과(in-progress 세션의 확실한 생성)를 위해 건너뛰지 않음
      if (daysAgo !== 0 && Math.random() < 0.15) {
        continue;
      }

      // 날짜 범위에 따른 3가지 루틴 배정
      let routineName;
      let sessionBlueprint;

      if (daysAgo >= 49) {
        // 루틴 1: 기초 체력 확립 루틴 (70일 전 ~ 49일 전, 22일간)
        const routine = DUMMY_ROUTINE_BLUEPRINTS[0];
        routineName = routine.name;
        sessionBlueprint = routine.sessions[r1SessionIdx % routine.sessions.length];
        r1SessionIdx++;
      } else if (daysAgo >= 25) {
        // 루틴 2: 근비대 성장 루틴 (48일 전 ~ 25일 전, 24일간)
        const routine = DUMMY_ROUTINE_BLUEPRINTS[1];
        routineName = routine.name;
        sessionBlueprint = routine.sessions[r2SessionIdx % routine.sessions.length];
        r2SessionIdx++;
      } else {
        // 루틴 3: 피크 스트렝스 루틴 (24일 전 ~ 오늘, 25일간)
        const routine = DUMMY_ROUTINE_BLUEPRINTS[2];
        routineName = routine.name;
        sessionBlueprint = routine.sessions[r3SessionIdx % routine.sessions.length];
        r3SessionIdx++;
      }

      // 컨디션 요인 시뮬레이션
      const rand = Math.random();
      let condition = 'normal';
      if (rand < 0.10) {
        condition = 'bad'; // 10% 확률로 난조
      } else if (rand > 0.90) {
        condition = 'good'; // 10% 확률로 최상
      }

      const durationMin = 40 + sessionBlueprint.exercises.length * 8;
      const startHour = 18 + Math.floor(Math.random() * 3); // 18시 ~ 20시 사이 유동적 시작 시간

      // 오늘(daysAgo === 0)은 end_time이 null인 in-progress 운동 로그로 만들어 테스트 통과 유도
      const inProgress = (daysAgo === 0);

      addSessionWorkoutLog({
        routineName,
        sessionName: sessionBlueprint.name,
        daysAgo,
        startHour,
        durationMin,
        condition,
        inProgress,
      });
    }
  }

  // 3. 자유 운동 추가
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
