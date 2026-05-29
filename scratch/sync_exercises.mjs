import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const baseDir = '/Users/kutor/Documents/Projects_Kutor/gridset';
const envPath = path.join(baseDir, '.env.local');
const jsonPath = path.join(baseDir, 'scratch/extracted_exercises.json');

console.log('🚀 [Supabase Cloud DB - 로컬 JSON 실시간 동기화 시작]');

// 1. .env.local 환경 변수 직접 파싱
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local 파일이 없습니다. 키 등록을 먼저 진행해 주세요.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

// VITE_SUPABASE_URL의 끝에 /rest/v1/ 이 붙어있을 수 있으므로 정규화
let supabaseUrl = env.VITE_SUPABASE_URL || '';
if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/')) {
  supabaseUrl = supabaseUrl.slice(0, -1);
}

// RLS를 우회하는 마스터 Service Role Key 획득
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Error: .env.local 내에 VITE_SUPABASE_URL이 정의되어 있지 않습니다.');
  process.exit(1);
}
if (!serviceRoleKey) {
  console.error('Error: .env.local 내에 SUPABASE_SERVICE_ROLE_KEY가 정의되어 있지 않습니다.');
  process.exit(1);
}

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY가 없어 anon key로 시도합니다. RLS 설정에 따라 쓰기가 차단될 수 있습니다.');
}

// 2. JSON 데이터 로드
if (!fs.existsSync(jsonPath)) {
  console.error(`Error: ${jsonPath} 파일이 존재하지 않습니다.`);
  process.exit(1);
}
const exercises = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
console.log(`✓ 로컬 정제 파일 로드 완료. 총 운동 개수: ${exercises.length}개`);

// 3. 결정론적 UUID 매핑 및 데이터 DB 스펙에 맞게 포맷팅
function uuidFromSeed(seed) {
  const bytes = [
    ...crypto.createHash('sha1').update(`gridset-exercise:${seed}`).digest().subarray(0, 16),
  ];
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const payload = exercises.map((item) => {
  const finalId = uuidRegex.test(item.id) ? item.id : uuidFromSeed(item.id);
  return {
    id: finalId,
    name: item.name,
    english_name: item.englishName || null,
    primary_muscle: item.primaryMuscle,
    secondary_muscles: item.secondaryMuscles || [],
    equipment: item.equipment || '기타',
    category: item.category || 'strength',
    unit: item.unit || 'kg',
    is_unilateral: item.is_unilateral ?? item.isUnilateral ?? false,
    synonyms: item.synonyms || [],
    user_id: null
  };
});

// 4. Supabase REST API를 통해 Upsert 요청 발송
async function syncDatabase() {
  const endpoint = `${supabaseUrl}/rest/v1/exercises`;
  
  try {
    console.log('📡 Supabase Cloud DB로 동기화 업로드 요청 중...');
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates, return=minimal' // 중복 발생 시 머지(Upsert)
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('🎉 [동기화 성공] 875개의 최신 운동 데이터가 Supabase Cloud DB에 실시간 저장되었습니다!');
    } else {
      const errText = await response.text();
      console.error(`❌ [동기화 실패] HTTP 상태 코드: ${response.status}`);
      console.error(`상세 에러 내용: ${errText}`);
    }
  } catch (error) {
    console.error('❌ [네트워크 오류] Supabase와 연결할 수 없습니다:', error.message);
  }
}

syncDatabase();
