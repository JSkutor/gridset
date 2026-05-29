import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const baseDir = '/Users/kutor/Documents/Projects_Kutor/gridset';
const jsonPath = path.join(baseDir, 'scratch/extracted_exercises.json');
const sqlOutputPath = path.join(baseDir, 'scratch/supabase_seed_default_exercises.sql');
const schemaPath = path.join(baseDir, 'scratch/supabase_schema.sql');

console.log('--- 정제된 운동 데이터 기반 Supabase SQL 시드 생성 시작 ---');

if (!fs.existsSync(jsonPath)) {
  console.error(`Error: ${jsonPath} 파일이 존재하지 않습니다. 먼저 정제 작업을 완료해 주세요.`);
  process.exit(1);
}

// 1. JSON 로드
const exercises = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log(`성공적으로 ${exercises.length}개의 정제된 운동 데이터를 로드했습니다.`);

// 결정론적 UUID 생성 함수 (기존 프로젝트 설계와 100% 일치)
function uuidFromSeed(seed) {
  const bytes = [
    ...crypto.createHash('sha1').update(`gridset-exercise:${seed}`).digest().subarray(0, 16),
  ];
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// UUID 정규식 검사
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 2. SQL 헬퍼 함수
function sqlString(value) {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlArray(values = []) {
  return `ARRAY[${values.map(sqlString).join(', ')}]::text[]`;
}

// 3. Insert Value Rows 빌드
// JSON의 camelCase 필드명을 Supabase DB의 snake_case 컬럼명에 맞게 매핑
const rows = exercises.map((exercise) => {
  // 만약 id가 순수 UUID 포맷이 아니라면 결정론적 UUID 해시 생성기로 변환!
  const rawId = exercise.id;
  const processedId = uuidRegex.test(rawId) ? rawId : uuidFromSeed(rawId);
  
  const id = sqlString(processedId);
  const name = sqlString(exercise.name);
  const englishName = sqlString(exercise.englishName);
  const primaryMuscle = sqlString(exercise.primaryMuscle);
  const secondaryMuscles = sqlArray(exercise.secondaryMuscles);
  const equipment = sqlString(exercise.equipment || '기타');
  const category = sqlString(exercise.category || 'strength');
  const unit = sqlString(exercise.unit || 'kg');
  const isUnilateral = exercise.is_unilateral ?? exercise.isUnilateral ?? false;
  const synonyms = sqlArray(exercise.synonyms);

  return `  (${id}, ${name}, ${englishName}, ${primaryMuscle}, ${secondaryMuscles}, ${equipment}, ${category}, ${unit}, ${isUnilateral ? 'true' : 'false'}, ${synonyms}, null)`;
}).join(',\n');

// 4. SQL 템플릿 작성
const seedSql = `-- Run this once in the Supabase SQL Editor to populate the exercises table.
-- 이 SQL 스크립트는 정제된 873개의 운동 마스터 데이터를 Supabase DB에 반영/업데이트합니다.

INSERT INTO public.exercises (
  id,
  name,
  english_name,
  primary_muscle,
  secondary_muscles,
  equipment,
  category,
  unit,
  is_unilateral,
  synonyms,
  user_id
) VALUES
${rows}
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  english_name = excluded.english_name,
  primary_muscle = excluded.primary_muscle,
  secondary_muscles = excluded.secondary_muscles,
  equipment = excluded.equipment,
  category = excluded.category,
  unit = excluded.unit,
  is_unilateral = excluded.is_unilateral,
  synonyms = excluded.synonyms,
  user_id = null,
  updated_at = timezone('utc'::text, now());
`;

// 5. 파일 쓰기 (supabase_seed_default_exercises.sql)
fs.writeFileSync(sqlOutputPath, seedSql, 'utf8');
console.log(`✓ SQL 시드 파일 생성 완료: ${sqlOutputPath}`);

// 6. supabase_schema.sql 스키마 파일에도 동일 시드 데이터 주입 업데이트
if (fs.existsSync(schemaPath)) {
  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    let start = schema.indexOf('-- ----------------------------------------------------\n-- Public Exercise Master');
    if (start === -1) {
      start = schema.indexOf('-- ----------------------------------------------------\n-- Public Default Exercises');
    }
    const end = schema.indexOf('-- ----------------------------------------------------\n-- API Grants');

    if (start !== -1 && end !== -1 && end > start) {
      const schemaSeed = `-- ----------------------------------------------------
-- Public Exercise Master
-- ----------------------------------------------------
-- These rows are shared by every user and are referenced by templates and workout logs.
${seedSql}
`;
      fs.writeFileSync(schemaPath, schema.slice(0, start) + schemaSeed + schema.slice(end), 'utf8');
      console.log(`✓ SQL 스키마 통합 업데이트 완료: ${schemaPath}`);
    } else {
      console.log('💡 스키마 파일 내의 Seed 삽입 위치 오프셋을 찾지 못해 스키마 통합 업데이트를 건너뛰었습니다. (단독 SQL 시드는 성공적으로 생성됨)');
    }
  } catch (err) {
    console.warn('💡 스키마 업데이트 중 오류가 발생했으나 시드 SQL 파일은 무사히 작성되었습니다:', err.message);
  }
} else {
  console.log('💡 supabase_schema.sql 파일이 존재하지 않아 스키마 파일 주입 단계는 건너뛰었습니다.');
}

console.log('🎉 Supabase SQL 시드 생성 완료!');
