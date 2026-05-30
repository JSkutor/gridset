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
  '풀업': 'reps',
  '바벨 로우': 'kg',
  '덤벨 숄더 프레스': 'kg',
  '불가리안 스플릿 스쿼트': 'kg',
  '플랭크': 'sec',
  '푸시업': 'reps',
  '데드버그': 'reps',
  '힙 브릿지': 'reps',
  '사이드 플랭크': 'sec',
  '밴드 풀 어파트': 'reps',
  '마운틴 클라이머': 'reps',
  '인버티드 로우': 'reps',
  '사이드 레그 레이즈': 'reps',
};

const EXERCISE_UNIT_OVERRIDES = new Map(Object.entries(DEFAULT_EXERCISE_UNITS));
const EXERCISE_EQUIPMENT_OVERRIDES = {
  '마운틴 클라이머': '맨몸',
  '인버티드 로우': '맨몸',
  '밴드 스쿼트': '밴드',
};

export const getDefaultExerciseUnit = (name) => EXERCISE_UNIT_OVERRIDES.get(name) || 'kg';

// Default seed exercises with muscle and equipment info
export const DEFAULT_EXERCISES = [
  { id: DEFAULT_EXERCISE_IDS['벤치프레스'], name: '벤치프레스', englishName: 'Bench Press', primary_muscle: '대흉근', secondaryMuscles: ['삼각근', '상완삼두근'], equipment: '바벨', category: 'strength', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: DEFAULT_EXERCISE_IDS['스쿼트'], name: '스쿼트', englishName: 'Squat', primary_muscle: '대퇴사두', secondaryMuscles: ['둔근', '햄스트링'], equipment: '바벨', category: 'strength', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: DEFAULT_EXERCISE_IDS['데드리프트'], name: '데드리프트', englishName: 'Deadlift', primary_muscle: '척추기립근', secondaryMuscles: ['둔근', '햄스트링'], equipment: '바벨', category: 'strength', unit: 'kg', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: DEFAULT_EXERCISE_IDS['풀업'], name: '풀업', englishName: 'Pull Up', primary_muscle: '광배근', secondaryMuscles: ['상완이두근'], equipment: '맨몸', category: 'strength', unit: 'reps', is_unilateral: false, user_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
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
    name: '퇴근 후 기초 홈트',
    sessions: [
      {
        name: '밀기와 코어 적응',
        exercises: [
          targetExercise('푸시업', 3, 8, 75, 90),
          targetExercise('덤벨 플로어 프레스', 3, 10, 90, 120),
          targetExercise('덤벨 킥백', 3, 10, 75, 90),
          targetExercise('데드버그', 3, 8, 45, 60),
          targetExercise('플랭크', 2, 35, 45, 60),
        ],
        groups: [
          { name: '푸시 파워세트', start_order: 1, size: 2 },
          { name: '팔-코어 라운드', start_order: 3, size: 2 },
        ],
      },
      {
        name: '하체 균형 잡기',
        exercises: [
          targetExercise('덤벨 스쿼트', 3, 10, 90, 120),
          targetExercise('밴드 풀스루', 3, 12, 60, 75),
          targetExercise('힙 브릿지', 3, 12, 60, 75),
          targetExercise('덤벨 스텝업', 2, 8, 90, 120),
          targetExercise('플랭크', 2, 35, 45, 60),
        ],
        groups: [
          { name: '둔근 라운드', start_order: 2, size: 2 },
        ],
      },
      {
        name: '등과 자세 보강',
        exercises: [
          targetExercise('덤벨 로우', 3, 10, 90, 120),
          targetExercise('밴드 리어 델트 플라이', 3, 15, 45, 60),
          targetExercise('밴드 풀 어파트', 3, 15, 45, 60),
          targetExercise('덤벨 컬', 2, 10, 60, 75),
          targetExercise('사이드 플랭크', 2, 25, 45, 60),
        ],
        groups: [
          { name: '등 자세 파워세트', start_order: 1, size: 3 },
        ],
      },
      {
        name: '전신 가볍게 연결',
        exercises: [
          targetExercise('덤벨 리버스 런지', 3, 8, 90, 120),
          targetExercise('덤벨 숄더 프레스', 3, 8, 90, 105),
          targetExercise('마운틴 클라이머', 3, 28, 45, 60),
          targetExercise('데드버그', 3, 8, 45, 60),
          targetExercise('사이드 레그 레이즈', 2, 12, 45, 60),
        ],
        groups: [
          { name: '전신 라운드', start_order: 1, size: 4 },
        ],
      },
    ],
  },
  {
    name: '덤벨 볼륨 홈트',
    sessions: [
      {
        name: '상체 볼륨',
        exercises: [
          targetExercise('푸시업', 3, 12, 75, 90),
          targetExercise('덤벨 플로어 프레스', 3, 10, 90, 120),
          targetExercise('덤벨 로우', 3, 12, 90, 120),
          targetExercise('밴드 리어 델트 플라이', 3, 16, 45, 60),
          targetExercise('덤벨 컬', 2, 12, 60, 75),
        ],
        groups: [
          { name: '밀고 당기기 파워세트', start_order: 2, size: 2 },
        ],
      },
      {
        name: '하체와 둔근',
        exercises: [
          targetExercise('덤벨 스쿼트', 4, 10, 90, 120),
          targetExercise('밴드 스쿼트', 4, 12, 75, 90),
          targetExercise('덤벨 리버스 런지', 3, 10, 90, 120),
          targetExercise('밴드 풀스루', 3, 14, 60, 75),
          targetExercise('힙 브릿지', 3, 15, 60, 75),
        ],
        groups: [
          { name: '하체 볼륨 라운드', start_order: 1, size: 2 },
          { name: '마무리 둔근세트', start_order: 4, size: 2 },
        ],
      },
      {
        name: '어깨와 등 자세',
        exercises: [
          targetExercise('덤벨 숄더 프레스', 3, 10, 90, 105),
          targetExercise('덤벨 레이즈', 3, 12, 60, 75),
          targetExercise('밴드 사이드 레터럴 레이즈', 3, 15, 45, 60),
          targetExercise('밴드 풀 어파트', 3, 18, 45, 60),
          targetExercise('사이드 플랭크', 2, 30, 45, 60),
        ],
        groups: [
          { name: '어깨 펌프 라운드', start_order: 2, size: 3 },
        ],
      },
      {
        name: '짧은 코어 컨디셔닝',
        exercises: [
          targetExercise('마운틴 클라이머', 3, 30, 45, 60),
          targetExercise('플랭크', 2, 45, 45, 60),
          targetExercise('데드버그', 3, 10, 45, 60),
          targetExercise('사이드 레그 레이즈', 2, 14, 45, 60),
          targetExercise('푸시업', 2, 10, 60, 75),
        ],
        groups: [
          { name: '코어 라운드', start_order: 1, size: 4 },
        ],
      },
    ],
  },
  {
    name: '짧고 진한 유지 루틴',
    sessions: [
      {
        name: '상체 강도',
        exercises: [
          targetExercise('덤벨 플로어 프레스', 4, 8, 105, 135),
          targetExercise('덤벨 로우', 4, 10, 90, 120),
          targetExercise('푸시업', 4, 12, 75, 90),
          targetExercise('덤벨 킥백', 3, 10, 75, 90),
          targetExercise('덤벨 컬', 3, 10, 60, 75),
        ],
        groups: [
          { name: '상체 파워세트', start_order: 1, size: 3 },
          { name: '팔 마무리', start_order: 4, size: 2 },
        ],
      },
      {
        name: '하체 단단히',
        exercises: [
          targetExercise('덤벨 스쿼트', 4, 8, 105, 135),
          targetExercise('덤벨 스텝업', 4, 8, 90, 120),
          targetExercise('덤벨 리버스 런지', 3, 8, 90, 120),
          targetExercise('밴드 풀스루', 3, 14, 60, 75),
          targetExercise('힙 브릿지', 3, 18, 60, 75),
        ],
        groups: [
          { name: '한쪽씩 하체 라운드', start_order: 2, size: 2 },
        ],
      },
      {
        name: '어깨와 등 마무리',
        exercises: [
          targetExercise('덤벨 숄더 프레스', 3, 8, 105, 120),
          targetExercise('덤벨 로우', 3, 10, 90, 120),
          targetExercise('밴드 풀 어파트', 2, 20, 45, 60),
          targetExercise('밴드 리어 델트 플라이', 2, 18, 45, 60),
          targetExercise('덤벨 레이즈', 2, 12, 60, 75),
        ],
        groups: [
          { name: '후면 라운드', start_order: 3, size: 3 },
        ],
      },
      {
        name: '코어 회복',
        exercises: [
          targetExercise('플랭크', 3, 50, 45, 60),
          targetExercise('사이드 플랭크', 2, 35, 45, 60),
          targetExercise('데드버그', 2, 12, 45, 60),
          targetExercise('힙 브릿지', 2, 16, 60, 75),
          targetExercise('밴드 풀 어파트', 2, 18, 45, 60),
        ],
        groups: [
          { name: '회복 라운드', start_order: 1, size: 3 },
        ],
      },
    ],
  },
];

const DUMMY_GROUP_COLORS = ['#7aa2f7', '#9ece6a', '#e0af68', '#f7768e'];

const DUMMY_WEEK_COUNT = 8;
const WEEKLY_SESSION_DAY_OFFSETS_BY_WEEK = [
  [6, 4, 2, 0],
  [6, 3, 1],
  [5, 4, 2, 0],
  [6, 4, 1, 0],
  [5, 3, 2, 0],
  [6, 4, 2],
  [6, 5, 3, 0],
  [5, 3, 1, 0],
];
const ROUTINE_PHASES = [
  { routineIndex: 0, startWeek: 0, endWeek: 2, createdDaysAgo: 56 },
  { routineIndex: 1, startWeek: 3, endWeek: 5, createdDaysAgo: 35 },
  { routineIndex: 2, startWeek: 6, endWeek: 7, createdDaysAgo: 14 },
];

const CONDITION_SEQUENCE = [
  'normal', 'fresh', 'normal', 'tired',
  'normal', 'normal', 'fresh', 'normal',
  'tired', 'normal', 'normal', 'fresh',
  'normal', 'pressed', 'normal', 'normal',
];

const EXERCISE_PROGRESS_PROFILES = {
  '덤벨 플로어 프레스': { weightStart: 8, weightEnd: 14, weightStep: 1, recordStart: 8, recordEnd: 11 },
  '덤벨 로우': { weightStart: 10, weightEnd: 18, weightStep: 1, recordStart: 9, recordEnd: 12 },
  '덤벨 숄더 프레스': { weightStart: 5, weightEnd: 9, weightStep: 1, recordStart: 7, recordEnd: 10 },
  '덤벨 킥백': { weightStart: 3, weightEnd: 6, weightStep: 1, recordStart: 9, recordEnd: 12 },
  '덤벨 컬': { weightStart: 4, weightEnd: 8, weightStep: 1, recordStart: 9, recordEnd: 12 },
  '덤벨 레이즈': { weightStart: 3, weightEnd: 6, weightStep: 1, recordStart: 10, recordEnd: 14 },
  '덤벨 스쿼트': { weightStart: 10, weightEnd: 16, weightStep: 1, recordStart: 9, recordEnd: 12 },
  '덤벨 리버스 런지': { weightStart: 5, weightEnd: 9, weightStep: 1, recordStart: 7, recordEnd: 10 },
  '덤벨 스텝업': { weightStart: 4, weightEnd: 8, weightStep: 1, recordStart: 7, recordEnd: 10 },
  '밴드 스쿼트': { weightStart: 0, weightEnd: 0, recordStart: 10, recordEnd: 15 },
  '밴드 풀스루': { weightStart: 0, weightEnd: 0, recordStart: 12, recordEnd: 18 },
  '밴드 리어 델트 플라이': { weightStart: 0, weightEnd: 0, recordStart: 13, recordEnd: 20 },
  '밴드 사이드 레터럴 레이즈': { weightStart: 0, weightEnd: 0, recordStart: 12, recordEnd: 18 },
  '푸시업': { recordStart: 7, recordEnd: 15 },
  '힙 브릿지': { recordStart: 12, recordEnd: 20 },
  '데드버그': { recordStart: 8, recordEnd: 13 },
  '밴드 풀 어파트': { recordStart: 14, recordEnd: 22 },
  '마운틴 클라이머': { recordStart: 24, recordEnd: 40 },
  '플랭크': { recordStart: 30, recordEnd: 62 },
  '사이드 플랭크': { recordStart: 22, recordEnd: 45 },
  '사이드 레그 레이즈': { recordStart: 10, recordEnd: 18 },
};

const EXERCISE_MEMO_DETAILS = {
  '푸시업': [
    '손목이 살짝 싫어함',
    '가슴 깊이는 오늘 괜찮음',
    '막판은 그냥 버팀',
    '팔꿈치 벌어짐',
  ],
  '덤벨 플로어 프레스': [
    '오른팔이 먼저 도망감',
    '바닥에서 튕기지 말기',
    '생각보다 잘 밀림',
    '한 세트 더는 싫음',
  ],
  '덤벨 로우': [
    '허리보다 등이 먼저 와야 함',
    '목에 힘 너무 들어감',
    '왼쪽 느낌이 흐림',
    '당기는 길은 좋았음',
  ],
  '덤벨 숄더 프레스': [
    '갈비뼈 자꾸 뜸',
    '삼두가 먼저 털림',
    '위에서 덤벨 부딪힘',
    '오늘은 무게 욕심 아님',
  ],
  '덤벨 스쿼트': [
    '무릎이 안쪽으로 말림',
    '발바닥은 안정적',
    '깊이는 이 정도가 맞음',
    '허벅지보다 숨이 힘듦',
  ],
  '덤벨 리버스 런지': [
    '보폭 다시 잡기',
    '고관절이 뻣뻣함',
    '왼쪽 균형 별로',
    '앞발에 힘 실림',
  ],
  '힙 브릿지': [
    '둔근 느낌 확실함',
    '허리로 받지 말기',
    '상단 멈춤 좋았음',
    '발 위치 한 뼘 줄임',
  ],
  '플랭크': [
    '복부보다 멘탈이 먼저 흔들림',
    '골반 떨어짐',
    '팔꿈치 바닥 아픔',
    '호흡 세면 버틸 만함',
  ],
  '사이드 플랭크': [
    '아래 어깨가 불편함',
    '골반 계속 내려감',
    '오른쪽이 훨씬 낫다',
    '짧게 해도 충분히 힘듦',
  ],
  '데드버그': [
    '허리 뜨면 바로 멈춤',
    '천천히 하니 더 힘듦',
    '쉬워 보이는데 아님',
    '호흡 놓치면 망함',
  ],
  '밴드 풀 어파트': [
    '밴드 장력 딱 좋음',
    '어깨 뒤쪽 잘 옴',
    '반동 쓰려다 참음',
    '마지막은 대충 될 뻔',
  ],
  '마운틴 클라이머': [
    '손바닥 땀 때문에 미끄러움',
    '템포 낮춰야 폼 산다',
    '숨이 너무 빨리 참',
    '골반 흔들림',
  ],
  '덤벨 킥백': ['팔꿈치 고정 안 됨', '가벼운데 타는 느낌', '오른쪽이 더 성급함', '반동 쓰지 말기'],
  '덤벨 컬': ['손목 꺾임', '마지막 두 개는 못생김', '팔꿈치 앞으로 나감', '무게는 아직 이 정도'],
  '덤벨 레이즈': ['승모근 개입 심함', '낮게 올려도 충분함', '팔꿈치 살짝 굽힘', '가벼운 척 힘듦'],
  '덤벨 스텝업': ['발 올릴 때 흔들림', '왼쪽이 확실히 약함', '무릎은 괜찮음', '박스 높이 이게 맞음'],
  '밴드 스쿼트': ['밴드 위치 귀찮음', '깊이는 괜찮음', '무릎 밖으로 밀기', '가볍게 보기 금지'],
  '밴드 풀스루': ['햄스트링 느낌 좋음', '허리로 당기지 말기', '엉덩이 뒤로 더', '밴드 고정 다시 확인'],
  '밴드 리어 델트 플라이': ['어깨 뒤쪽 잘 잡힘', '팔보다 견갑 생각', '범위 줄이니 낫다', '반동 바로 티남'],
  '밴드 사이드 레터럴 레이즈': ['불타는데 무게는 없음', '어깨 올라감', '천천히가 답', '끝까지 예쁘게 안 됨'],
  '사이드 레그 레이즈': ['골반 고정 어렵다', '생각보다 옆구리도 탐', '오른쪽이 더 잘 올라감', '허리 꺾지 말기'],
};

const MEMO_CONTEXTS = {
  normal: ['그냥 이대로 가자', '나쁘지 않음', '다음에도 확인', '욕심낼 정도는 아님'],
  fresh: ['오늘 몸 가볍다', '조금 더 해도 됐을 듯', '괜히 신남', '다음에 올려볼 만함'],
  tired: ['오늘은 여기까지', '폼만 챙기자', '억지로 밀지 말기', '컨디션 별로'],
  pressed: ['시간 없어서 짧게', '대충 넘기지 말기', '휴식 줄였더니 빡셈', '기록만 남김'],
};

const MEMO_UNIQUE_TAILS = ['다음엔 천천히', '오늘 기준', '괜히 무리하지 말기', '이건 기억'];

function getDummyRequiredExerciseNames() {
  return [
    ...new Set([
      ...DUMMY_ROUTINE_BLUEPRINTS.flatMap((routine) =>
        routine.sessions.flatMap((session) => session.exercises.map((exercise) => exercise.name)),
      ),
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
    equipment: EXERCISE_EQUIPMENT_OVERRIDES[dictionaryExercise.name] || dictionaryExercise.equipment || '기타',
    category: dictionaryExercise.category || 'strength',
    unit: EXERCISE_UNIT_OVERRIDES.get(dictionaryExercise.name) || dictionaryExercise.unit || getDefaultExerciseUnit(dictionaryExercise.name),
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function interpolate(start, end, ratio) {
  return start + (end - start) * ratio;
}

function roundToStep(value, step = 1) {
  return Math.round(value / step) * step;
}

function getRoutinePhaseForWeek(weekIndex) {
  return ROUTINE_PHASES.find((phase) => weekIndex >= phase.startWeek && weekIndex <= phase.endWeek) || ROUTINE_PHASES[0];
}

function getProgressRatio(daysAgo) {
  const oldestWeekOffset = Math.max(...WEEKLY_SESSION_DAY_OFFSETS_BY_WEEK[0]);
  const oldestDaysAgo = (DUMMY_WEEK_COUNT - 1) * 7 + oldestWeekOffset;
  return clamp((oldestDaysAgo - daysAgo) / oldestDaysAgo, 0, 1);
}

function isBodyweightRecordExercise(exercise) {
  const unit = exercise?.unit || getDefaultExerciseUnit(exercise?.name);
  return unit === 'reps' || unit === 'sec' || exercise?.equipment === '맨몸';
}

function getConditionRecordAdjustment(condition, unit) {
  const isTimed = unit === 'sec';
  if (condition === 'fresh') return isTimed ? 5 : 1;
  if (condition === 'tired') return isTimed ? -6 : -2;
  if (condition === 'pressed') return isTimed ? -3 : -1;
  return 0;
}

function getSetFatigueAdjustment(setIndex, unit) {
  if (setIndex === 0) return 0;
  if (unit === 'sec') return setIndex === 1 ? -3 : -6;
  if (setIndex === 1) return 0;
  if (setIndex === 2) return -1;
  return -2;
}

function getSideRecordAdjustment(exercise, side, setIndex, logIndex) {
  if (!exercise.is_unilateral || side === 'both') return 0;

  const isTimed = exercise.unit === 'sec';
  const weakerLeftToday = (logIndex + setIndex) % 3 !== 1;
  if (side === 'L' && weakerLeftToday) return isTimed ? -2 : -1;
  if (side === 'R' && !weakerLeftToday) return isTimed ? -1 : 0;
  return 0;
}

function getSetRecordValue({ exercise, link, setIndex, side, daysAgo, condition, logIndex }) {
  const profile = EXERCISE_PROGRESS_PROFILES[exercise.name] || {};
  const progressRatio = getProgressRatio(daysAgo);
  const targetRecord = Number(link.target_record) || profile.recordStart || 10;
  const unit = exercise.unit || getDefaultExerciseUnit(exercise.name);
  const baseRecord = profile.recordStart && profile.recordEnd
    ? interpolate(profile.recordStart, profile.recordEnd, progressRatio)
    : targetRecord;
  const blendedRecord = (baseRecord * 0.7) + (targetRecord * 0.3);

  const adjustedRecord = blendedRecord
    + getConditionRecordAdjustment(condition, unit)
    + getSetFatigueAdjustment(setIndex, unit)
    + getSideRecordAdjustment(exercise, side, setIndex, logIndex);

  const minimum = unit === 'sec' ? 12 : 3;
  return Math.max(minimum, Math.round(adjustedRecord));
}

function getSetWeight({ exercise, daysAgo, condition }) {
  if (isBodyweightRecordExercise(exercise)) return 0;

  const profile = EXERCISE_PROGRESS_PROFILES[exercise.name];
  if (!profile?.weightStart || !profile?.weightEnd) return 0;

  const progressRatio = getProgressRatio(daysAgo);
  const step = profile.weightStep || 1;
  let weight = interpolate(profile.weightStart, profile.weightEnd, progressRatio);
  if (condition === 'fresh' && progressRatio > 0.35) weight += step;
  if (condition === 'tired') weight -= step;
  if (condition === 'pressed' && progressRatio < 0.5) weight -= step;

  return Math.max(profile.weightStart, roundToStep(weight, step));
}

function getStartClock(weekIndex, sessionDayIndex) {
  const clocks = [
    { hour: 19, minute: 10 },
    { hour: 20, minute: 0 },
    { hour: 18, minute: 40 },
    { hour: 10, minute: 30 },
  ];
  const base = clocks[sessionDayIndex % clocks.length];
  return {
    hour: base.hour,
    minute: (base.minute + (weekIndex % 3) * 5) % 60,
  };
}

function getLogCondition(logIndex) {
  return CONDITION_SEQUENCE[logIndex % CONDITION_SEQUENCE.length];
}

function getMemoFallbackDetails(exercise) {
  if (exercise?.equipment === '덤벨') {
    return [
      '핀 확인',
      '공간 좁음',
      '손잡이 닦음',
      '반동 줄임',
    ];
  }

  return [
    '천천히',
    '호흡 먼저',
    '범위 확인',
    '무리 없음',
  ];
}

function shouldWriteSetMemo({ exercise, setNumber, side, condition, logIndex }) {
  const sideScore = side === 'L' ? 1 : side === 'R' ? 2 : 0;
  const score = exercise.name.length + setNumber + sideScore + logIndex;

  if (condition === 'tired' && setNumber === 1) return score % 2 === 0;
  if (condition === 'pressed' && setNumber > 1) return false;
  return score % 6 === 0;
}

function createUniqueSetMemo({ exercise, setNumber, side, condition, logIndex, usedMemos }) {
  const details = EXERCISE_MEMO_DETAILS[exercise.name] || getMemoFallbackDetails(exercise);
  const memoIndex = usedMemos.size;
  const detail = details[(memoIndex + setNumber + logIndex) % details.length];
  const contexts = MEMO_CONTEXTS[condition] || MEMO_CONTEXTS.normal;
  const context = contexts[(memoIndex + logIndex + setNumber) % contexts.length];
  const sideLabel = /왼쪽|오른쪽/.test(detail)
    ? ''
    : side === 'L' ? '왼쪽: ' : side === 'R' ? '오른쪽: ' : '';
  const patterns = [
    `${sideLabel}${detail}.`,
    `${sideLabel}${context}. ${detail}.`,
    `${sideLabel}${detail}. ${context}.`,
    `${sideLabel}${detail} - 다음에 다시 봄.`,
  ];
  const baseMemo = patterns[(memoIndex + logIndex) % patterns.length];
  let memo = baseMemo;
  let attempt = 0;

  while (usedMemos.has(memo)) {
    memo = `${baseMemo.replace(/\.$/, '')}. ${MEMO_UNIQUE_TAILS[attempt % MEMO_UNIQUE_TAILS.length]}.`;
    attempt += 1;
  }

  usedMemos.add(memo);
  return memo;
}

function estimateDurationMinutes(links, exercisesById, condition, sessionDayIndex) {
  const totalRows = links.reduce((sum, link) => {
    const exercise = exercisesById.get(link.exercise_id);
    const sideMultiplier = exercise?.is_unilateral ? 2 : 1;
    return sum + (Number(link.target_sets) || 1) * sideMultiplier;
  }, 0);

  let duration = 18 + links.length * 4 + totalRows * 2 + (sessionDayIndex % 2) * 3;
  if (condition === 'fresh') duration -= 2;
  if (condition === 'tired') duration += 4;
  if (condition === 'pressed') duration -= 6;
  return clamp(duration, 28, 58);
}

function createSetRecordsForExercise({
  logId,
  exercise,
  link,
  timestamp,
  daysAgo,
  condition,
  logIndex,
  usedMemos,
}) {
  const targetSets = Number(link.target_sets) || 3;
  const isUnilateral = exercise.is_unilateral ?? false;
  const records = [];

  for (let index = 0; index < targetSets; index++) {
    const setNumber = index + 1;
    const weight = getSetWeight({ exercise, daysAgo, condition });

    if (isUnilateral) {
      ['L', 'R'].forEach((side) => {
        const recordValue = getSetRecordValue({ exercise, link, setIndex: index, side, daysAgo, condition, logIndex });
        const memo = shouldWriteSetMemo({ exercise, setNumber, side, condition, logIndex })
          ? createUniqueSetMemo({
            exercise,
            setNumber,
            side,
            weight,
            record: recordValue,
            condition,
            logIndex,
            usedMemos,
          })
          : null;
        records.push({
          id: generateUUID(),
          workout_log_id: logId,
          exercise_id: exercise.id,
          set_number: setNumber,
          weight,
          record: String(recordValue),
          side,
          memo,
          created_at: timestamp,
          updated_at: timestamp,
        });
      });
    } else {
      const recordValue = getSetRecordValue({ exercise, link, setIndex: index, side: 'both', daysAgo, condition, logIndex });
      const memo = shouldWriteSetMemo({ exercise, setNumber, side: 'both', condition, logIndex })
        ? createUniqueSetMemo({
          exercise,
          setNumber,
          side: 'both',
          weight,
          record: recordValue,
          condition,
          logIndex,
          usedMemos,
        })
        : null;
      records.push({
        id: generateUUID(),
        workout_log_id: logId,
        exercise_id: exercise.id,
        set_number: setNumber,
        weight,
        record: String(recordValue),
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
  const sessionExerciseGroups = [];
  const workoutLogs = [];
  const setRecords = [];
  const sessionEntriesByKey = new Map();
  const usedMemos = new Set();

  DUMMY_ROUTINE_BLUEPRINTS.forEach((routineBlueprint, routineIndex) => {
    const phase = ROUTINE_PHASES.find((candidate) => candidate.routineIndex === routineIndex);
    const phaseCreatedDaysAgo = phase?.createdDaysAgo ?? 56;
    const routineCreatedAt = getPastDate(phaseCreatedDaysAgo, 9, 0).toISOString();
    const routineId = generateUUID();
    routines.push({
      id: routineId,
      name: routineBlueprint.name,
      user_id: userId,
      created_at: routineCreatedAt,
      updated_at: nowIso,
    });

    routineBlueprint.sessions.forEach((sessionBlueprint, sessionIndex) => {
      const sessionCreatedAt = getPastDate(
        Math.max(0, phaseCreatedDaysAgo - Math.floor(sessionIndex / 2)),
        10 + sessionIndex,
        0,
      ).toISOString();
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
      sessionEntriesByKey.set(`${routineIndex}:${sessionIndex}`, {
        session,
        blueprint: sessionBlueprint,
      });

      const sessionLinks = [];
      sessionBlueprint.exercises.forEach((exerciseTarget, exerciseIndex) => {
        const exercise = exercisesByName.get(normalizeExerciseName(exerciseTarget.name));
        const link = {
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
        };
        sessionLinks.push(link);
        sessionExercises.push(link);
      });

      (sessionBlueprint.groups || []).forEach((groupBlueprint, groupIndex) => {
        const startOrder = Number(groupBlueprint.start_order) || 1;
        const size = Number(groupBlueprint.size) || 2;
        const coveredLinks = sessionLinks.slice(startOrder - 1, startOrder - 1 + size);
        const firstLink = coveredLinks[0];

        if (coveredLinks.length < 2 || !firstLink) return;

        coveredLinks.forEach((link) => {
          link.target_sets = firstLink.target_sets;
          link.rest_between_sets = firstLink.rest_between_sets;
          link.rest_after_exercise = firstLink.rest_after_exercise;
          link.updated_at = nowIso;
        });

        sessionExerciseGroups.push({
          id: generateUUID(),
          session_id: sessionId,
          name: groupBlueprint.name,
          start_order: startOrder,
          size: coveredLinks.length,
          color: DUMMY_GROUP_COLORS[groupIndex % DUMMY_GROUP_COLORS.length],
          created_at: sessionCreatedAt,
          updated_at: nowIso,
        });
      });
    });
  });

  const addSessionWorkoutLog = ({
    routineIndex,
    sessionIndex,
    daysAgo,
    startHour,
    startMinute,
    condition,
    logIndex,
    sessionDayIndex,
    inProgress = false,
  }) => {
    const entry = sessionEntriesByKey.get(`${routineIndex}:${sessionIndex}`);
    if (!entry) return;

    const links = sessionExercises
      .filter((link) => link.session_id === entry.session.id)
      .sort((a, b) => a.order - b.order);
    const durationMin = estimateDurationMinutes(links, exercisesById, condition, sessionDayIndex);
    const start = inProgress ? addMinutes(new Date(), -Math.min(durationMin, 35)) : getPastDate(daysAgo, startHour, startMinute);
    const end = inProgress ? null : addMinutes(start, durationMin);
    const timestamp = start.toISOString();
    const logId = generateUUID();

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
          logIndex,
          usedMemos,
        }),
      );
    });
  };

  let logIndex = 0;
  const sessionCountByRoutine = new Map();

  for (let weekIndex = 0; weekIndex < DUMMY_WEEK_COUNT; weekIndex++) {
    const phase = getRoutinePhaseForWeek(weekIndex);
    const routine = DUMMY_ROUTINE_BLUEPRINTS[phase.routineIndex];
    const completedInRoutine = sessionCountByRoutine.get(phase.routineIndex) || 0;
    const weekSchedule = WEEKLY_SESSION_DAY_OFFSETS_BY_WEEK[weekIndex] || WEEKLY_SESSION_DAY_OFFSETS_BY_WEEK[0];

    weekSchedule.forEach((dayOffset, sessionDayIndex) => {
      const daysAgo = ((DUMMY_WEEK_COUNT - 1 - weekIndex) * 7) + dayOffset;
      const sessionIndex = (completedInRoutine + sessionDayIndex) % routine.sessions.length;
      const { hour, minute } = getStartClock(weekIndex, sessionDayIndex);
      const condition = getLogCondition(logIndex);

      addSessionWorkoutLog({
        routineIndex: phase.routineIndex,
        sessionIndex,
        daysAgo,
        startHour: hour,
        startMinute: minute,
        condition,
        logIndex,
        sessionDayIndex,
        inProgress: daysAgo === 0,
      });

      logIndex += 1;
    });

    sessionCountByRoutine.set(phase.routineIndex, completedInRoutine + weekSchedule.length);
  }

  return {
    exercises,
    routines,
    sessions,
    sessionExercises,
    sessionExerciseGroups,
    workoutLogs,
    setRecords,
  };
}
