import fs from 'node:fs';
import path from 'node:path';
import { EXERCISE_DICTIONARY as EXISTING_DICTIONARY } from '../src/data/exerciseDictionary.js';
import { MUSCLE_GROUPS } from '../src/data/muscleGroups.js';

const rawPath = './scratch/raw_yuhonas_exercises.json';
const rawExercises = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

// 1. Setup muscle mapping (English raw -> standard Korean)
const muscleMap = {
  'abdominals': '복근',
  'biceps': '상완이두근',
  'triceps': '상완삼두근',
  'shoulders': '삼각근',
  'chest': '대흉근',
  'lats': '광배근',
  'middle back': '광배근',
  'lower back': '척추기립근',
  'traps': '승모근',
  'quadriceps': '대퇴사두',
  'hamstrings': '햄스트링',
  'glutes': '둔근',
  'calves': '하퇴삼두근',
  'forearms': '전완근',
  'adductors': '내전근',
  'abductors': '외전근',
  'neck': '경부근'
};

// 2. Setup equipment mapping (English raw -> standard Korean)
const equipmentMap = {
  'body only': '맨몸',
  'barbell': '바벨',
  'dumbbell': '덤벨',
  'machine': '머신',
  'kettlebells': '케틀벨',
  'bands': '밴드',
  'cable': '케이블',
  'foam roll': '폼롤러',
  'exercise ball': '짐볼',
  'medicine ball': '메디신볼',
  'e-z curl bar': 'e-z curl bar',
  'other': '기타'
};

// 3. Translation matrix for individual words in exercise names
const translationDictionary = {
  // Equipment / Type
  'barbell': '바벨',
  'dumbbell': '덤벨',
  'cable': '케이블',
  'machine': '머신',
  'kettlebell': '케틀벨',
  'band': '밴드',
  'bands': '밴드',
  'smith': '스미스',
  'hammer': '해머',
  'preacher': '프리처',
  'scott': '스콧',
  'medicine': '메디신',
  'foam': '폼',
  'roller': '롤러',
  'ball': '볼',
  'stability': '스테빌리티',
  'exercise': '엑서사이즈',
  'ez': 'EZ',

  // Actions / Movements
  'press': '프레스',
  'curl': '컬',
  'extension': '익스텐션',
  'fly': '플라이',
  'flyes': '플라이',
  'row': '로우',
  'raise': '레이즈',
  'squat': '스쿼트',
  'deadlift': '데드리프트',
  'lunge': '런지',
  'push-up': '푸시업',
  'pushup': '푸시업',
  'pushups': '푸시업',
  'pull-up': '풀업',
  'pullup': '풀업',
  'pullups': '풀업',
  'chin-up': '친업',
  'chinup': '친업',
  'dip': '딥스',
  'dips': '딥스',
  'crunch': '크런치',
  'plank': '플랭크',
  'sit-up': '윗몸일으키기',
  'situp': '윗몸일으키기',
  'situps': '윗몸일으키기',
  'stretch': '스트레칭',
  'stretching': '스트레칭',
  'windmill': '윈드밀',
  'get-up': '겟업',
  'getup': '겟업',
  'walk': '워크',
  'clean': '클린',
  'snatch': '스내치',
  'jerk': '저크',
  'shrug': '슈러그',
  'shrugs': '슈러그',
  'pulldown': '풀다운',
  'pullover': '풀오버',
  'kickback': '킥백',
  'kickbacks': '킥백',
  'pushdown': '푸시다운',
  'pushdowns': '푸시다운',
  'abduction': '외전',
  'adduction': '내전',
  'bridge': '브릿지',
  'thrust': '쓰러스트',
  'thruster': '쓰러스터',
  'twist': '트위스트',
  'kicks': '킥',
  'kick': '킥',
  'raise/extension': '레이즈/익스텐션',

  // Direction / Position
  'incline': '인클라인',
  'decline': '디클라인',
  'reverse': '리버스',
  'seated': '시티드',
  'standing': '스탠딩',
  'lying': '라잉',
  'prone': '프론',
  'side': '사이드',
  'front': '프론트',
  'rear': '리어',
  'lateral': '레터럴',
  'overhead': '오버헤드',
  'close-grip': '클로즈그립',
  'close': '클로즈',
  'wide-grip': '와이드그립',
  'wide': '와이드',
  'grip': '그립',
  'underhand': '언더핸드',
  'overhand': '오버핸드',
  'neutral': '뉴트럴',
  'pronated': '프로네이티드',
  'supinated': '수피네이티드',
  'single-arm': '싱글암',
  'single': '싱글',
  'one-arm': '원암',
  'one': '원',
  'alternate': '얼터네이트',
  'alternating': '얼터네이트',
  'unilateral': '편측',
  'assisted': '어시스티드',
  'supported': '서포티드',
  'weighted': '웨이티드',
  'bent-over': '벤트오버',
  'bent': '벤트',
  'over': '오버',
  'straight-arm': '스트레이트암',
  'straight': '스트레이트',
  'behind': '비하인드',
  'neck': '넥',
  'floor': '플로어',
  'decline/seated': '디클라인/시티드',

  // Body parts in names
  'arm': '암',
  'leg': '레그',
  'chest': '체스트',
  'shoulder': '숄더',
  'back': '백',
  'hand': '핸드',
  'wrist': '리스트',
  'ankle': '앵클',
  'knee': '무릎',
  'hip': '힙',
  'calf': '카프',
  'glute': '글루트',
  'tricep': '삼두',
  'triceps': '삼두',
  'bicep': '이두',
  'biceps': '이두',
  'oblique': '외복사근',
  'obliques': '외복사근',
  'quad': '대퇴사두',
  'quads': '대퇴사두',
  'hamstring': '햄스트링',
  'hamstrings': '햄스트링',
  'groin': '서혜부',
  'adductor': '내전근',
  'abductor': '외전근',

  // Style / Miscellaneous
  'arnold': '아놀드',
  'jefferson': '제퍼슨',
  'zercher': '저처',
  'sumo': '스모',
  'romanian': '루마니안',
  'stiff-legged': '스티프 레그',
  'stiff-leg': '스티프 레그',
  'stiff': '스티프',
  'hack': '핵',
  'goblet': '고블렛',
  'bulgarian': '벌가리안',
  'pistol': '피스톨',
  'step-up': '스텝업',
  'stepup': '스텝업',
  'stability-ball': '짐볼',
  'medicine-ball': '메디신볼',
  'spider': '스파이더',
  'concentration': '컨센트레이션',
  'drag': '드래그',
  'good-morning': '굿모닝',
  'good': '굿',
  'morning': '모닝',
  'turkish': '터키시',
  'farmer': '파머스',
  'farmers': '파머스',
  'power': '파워',
  'hang': '행',
  'face': '페이스',
  'pull': '풀',
  'obliques/inflexion': '외복사근/굴곡',
  'smr': 'SMR',
  'bosu': '보수볼',
  'rack': '랙',
  't-bar': 'T바',
  't': 'T',
  'crossover': '크로스오버',
  'cross': '크로스',
  'straight-legged': '스트레이트 레그',
  'behind-the-neck': '비하인드 넥',
  'around-the-world': '어라운드 더 월드',
  'around': '어라운드',
  'world': '월드',
  'worlds': '월드',
  'toe': '토',
  'touchers': '터치',
  'touch': '터치'
};

// Map full raw names directly if standard patterns aren't natural
const manualNameTranslations = {
  '3/4 Sit-Up': '3/4 윗몸일으키기',
  '90/90 Hamstring': '90/90 햄스트링 스트레칭',
  'Ab Crunch Machine': '머신 크런치',
  'Ab Roller': '앱 롤러',
  'Air Bike': '에어 바이크',
  'All Fours Quad Stretch': '네발기기 대퇴사두 스트레칭',
  'Alternate Hammer Curl': '얼터네이트 해머 컬',
  'Alternate Heel Touchers': '얼터네이트 힐 터치',
  'Alternate Incline Dumbbell Curl': '얼터네이트 인클라인 덤벨 컬',
  'Alternating Floor Press': '얼터네이트 플로어 프레스',
  'Arnold Dumbbell Press': '아놀드 덤벨 프레스',
  'Around The Worlds': '어라운드 더 월드',
  'Band Pull Apart': '밴드 풀 어파트',
  'Burpee': '버피 테스트',
  'Chin-Up': '친업',
  'Face Pull': '페이스 풀',
  'Lat Pulldown': '랫 풀다운',
  'Mountain Climber': '마운틴 클라이머',
  'Russian Twist': '러시안 트위스트',
  'Superman': '슈퍼맨 자세',
  'Turkish Get-Up': '터키시 겟업'
};

function translateName(englishName) {
  if (manualNameTranslations[englishName]) {
    return manualNameTranslations[englishName];
  }
  
  // Custom smart rule-based phonetic translation
  const clean = englishName.replace(/[^a-zA-Z0-9\s\-\/\(\)]/g, '');
  const tokens = clean.split(/\s+/);
  
  const translatedTokens = tokens.map(token => {
    const lower = token.toLowerCase();
    
    // Check direct matching in word dictionary
    if (translationDictionary[lower]) {
      return translationDictionary[lower];
    }
    
    // Try without dashes
    const cleanLower = lower.replace('-', '');
    if (translationDictionary[cleanLower]) {
      return translationDictionary[cleanLower];
    }
    
    // Check parts in parens or brackets
    if (token.startsWith('(') && token.endsWith(')')) {
      const inner = token.slice(1, -1).toLowerCase();
      if (translationDictionary[inner]) {
        return `(${translationDictionary[inner]})`;
      }
    }
    
    // Phonetic fallback or title case capitalization if it doesn't match
    return token;
  });
  
  // Join the translated terms with spaces
  return translatedTokens.join(' ').replace(/\s+/g, ' ').trim();
}

function getSmartUnit(exercise, category, equipment) {
  const nameLower = exercise.name.toLowerCase();
  
  if (category === 'stretching') {
    return 'sec';
  }
  if (category === 'cardio') {
    return 'sec';
  }
  
  if (nameLower.includes('plank') || nameLower.includes('hold') || nameLower.includes('static') || nameLower.includes('stretch')) {
    return 'sec';
  }
  
  if (equipment === '맨몸') {
    return 'reps';
  }
  
  return 'kg';
}

function getSmartIsUnilateral(englishName) {
  const lower = englishName.toLowerCase();
  return (
    lower.includes('single-arm') ||
    lower.includes('single arm') ||
    lower.includes('one-arm') ||
    lower.includes('one arm') ||
    lower.includes('single-leg') ||
    lower.includes('single leg') ||
    lower.includes('one-leg') ||
    lower.includes('one leg') ||
    lower.includes('alternate') ||
    lower.includes('alternating') ||
    lower.includes('single') ||
    lower.includes('unilateral') ||
    lower.includes('side-to-side') ||
    lower.includes('side to side')
  );
}

// 4. Perform processing and merging
console.log('Merging databases...');
const existingIds = new Set(EXISTING_DICTIONARY.map(e => e.id));
const mergedDictionary = [...EXISTING_DICTIONARY];

let newCount = 0;
let skippedCount = 0;

rawExercises.forEach(raw => {
  if (existingIds.has(raw.id)) {
    skippedCount++;
    return;
  }
  
  // Process the raw entry
  const englishName = raw.name;
  const koreanName = translateName(englishName);
  
  // Map muscles and validate
  let primaryMuscle = muscleMap[raw.primaryMuscles[0]?.toLowerCase()] || '기타';
  const secondaryMuscles = (raw.secondaryMuscles || [])
    .map(m => muscleMap[m.toLowerCase()])
    .filter(Boolean)
    .filter(m => m !== primaryMuscle); // avoid duplicates in secondary
  
  const equipment = equipmentMap[raw.equipment?.toLowerCase()] || '기타';
  const category = raw.category || 'strength';
  const unit = getSmartUnit(raw, category, equipment);
  const is_unilateral = getSmartIsUnilateral(englishName);
  
  // Autocomplete synonyms
  const synonyms = [
    koreanName,
    englishName.toLowerCase(),
    englishName.toLowerCase().replace(/[^a-z0-9\s]/g, '')
  ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicate
  
  const mappedExercise = {
    id: raw.id,
    name: koreanName,
    englishName: englishName,
    primaryMuscle: primaryMuscle,
    secondaryMuscles: secondaryMuscles,
    equipment: equipment,
    synonyms: synonyms,
    category: category,
    unit: unit,
    is_unilateral: is_unilateral,
    user_id: null
  };
  
  mergedDictionary.push(mappedExercise);
  newCount++;
});

console.log(`Merged results:`);
console.log(`- Curated exercises preserved: ${EXISTING_DICTIONARY.length}`);
console.log(`- New exercises imported: ${newCount}`);
console.log(`- Exercises skipped (already present): ${skippedCount}`);
console.log(`- Total merged database size: ${mergedDictionary.length}`);

// Sort dictionary by ID alphabetically to keep it clean and deterministic
mergedDictionary.sort((a, b) => a.id.localeCompare(b.id));

// Validate that every muscle group matches MUSCLE_GROUPS exactly
const allowedMuscles = new Set(MUSCLE_GROUPS);
mergedDictionary.forEach(e => {
  if (!allowedMuscles.has(e.primaryMuscle)) {
    throw new Error(`Invalid primary muscle "${e.primaryMuscle}" in exercise ${e.id}`);
  }
  e.secondaryMuscles.forEach(m => {
    if (!allowedMuscles.has(m)) {
      throw new Error(`Invalid secondary muscle "${m}" in exercise ${e.id}`);
    }
  });
});
console.log('All muscle groups verified successfully!');

// 5. Write back files!
const dictPath = '../src/data/exerciseDictionary.js';
const extractedPath = '../scratch/extracted_exercises.json';

const codeContent = `// 100% 로컬 오프라인 작동을 위한 한국어 커스텀 운동 및 번역 딕셔너리
// 이 사전은 기획상 엄선된 대중적인 프리웨이트/맨몸 운동으로 압축 큐레이션 되었습니다.

export const EXERCISE_DICTIONARY = ${JSON.stringify(mergedDictionary, null, 2)};
`;

fs.writeFileSync(path.resolve(import.meta.dirname, dictPath), codeContent, 'utf8');
console.log(`Successfully updated ${dictPath}`);

// Write extracted_exercises.json which matches the test (without warnings or NOTE sections)
fs.writeFileSync(path.resolve(import.meta.dirname, extractedPath), JSON.stringify(mergedDictionary, null, 2), 'utf8');
console.log(`Successfully updated ${extractedPath}`);
