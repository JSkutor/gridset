# GridSet DB Schema (MVP 확정안)

향후 Supabase(PostgreSQL) 전환을 고려하여 `id`는 **UUID**를 사용하며, 테이블 구조를 극도로 단순화하여 로컬 스토리지(Zustand Persist) 구현에 용이하게 설계되었습니다.

---

## 개념 구조

```
routines (루틴 - 주간 운동 계획)
  └── sessions (세션 - 하루치 운동 계획, 1:N)
        ├── session_exercises (세션↔운동 매핑, M:N 중간 테이블)
        │     └── exercises (운동 종목 마스터)
        └── session_exercise_groups (슈퍼세트/서킷 그룹)

workout_logs (실제 수행 기록, 세션 참조)
  └── set_records (세트별 수행 기록)
```

---

## 1. `routines` (루틴)

유저가 만든 주간 단위 운동 프로그램입니다. "이번 주에 어떤 운동을 할 것인가"를 정의하며, 여러 세션(Session)으로 구성됩니다.

- `id` (UUID, PK)
- `name` (String): 루틴명 (예: "야들러 531", "3분할 PPL")
- `user_id` (String, FK → users)
- `created_at` / `updated_at`

> **관계**: `routines` 1 → N `sessions` (sessions 테이블의 `routine_id` FK로 관리)

---

## 2. `sessions` (세션)

루틴을 구성하는 하루치 운동 계획입니다. 세션은 특정 루틴에 귀속되며, 루틴 내의 순서를 가집니다.

- `id` (UUID, PK)
- `name` (String): 세션명 (예: "상체 (Push & Pull)", "하체 (Legs)")
- `routine_id` (UUID, FK → `routines.id`): 소속 루틴
- `session_order` (Int): 루틴 내에서의 세션 순서 (1, 2, 3...). `0`은 순서/로테이션에서 제외되는 임시 세션 예약값이며 루틴당 최대 1개만 사용합니다.
- `user_id` (String): 세션 소유자 (독립 조회 및 추후 확장 대비)
- `created_at` / `updated_at`

> **관계**: `sessions` M ↔ N `exercises` (중간 테이블 `session_exercises`로 관리)

---

## 3. `session_exercises` (세션-운동 매핑)

세션과 운동 종목 간의 M:N 관계를 해소하는 중간 테이블입니다. 세션에 어떤 운동이 몇 세트/몇 회 목표로 포함되는지 정의합니다. (목표 무게는 제외 — 실제 수행값은 `set_records`에서 관리)

- `id` (UUID, PK)
- `session_id` (UUID, FK → `sessions.id`)
- `exercise_id` (UUID, FK → `exercises.id`)
- `order` (Int): 세션 내 운동 순서
- `target_sets` (Int): 목표 세트 수 (예: 4)
- `target_record` (String or Int): 목표 기록 (횟수 또는 시간(초), 예: 10)
- `rest_between_sets` (Int, DEFAULT 90): 세트 간 휴식 시간 (초). 미설정 시 90초 적용
- `rest_after_exercise` (Int, DEFAULT 120): 운동 종료 후 다음 운동 전 휴식 시간 (초). 미설정 시 150초 적용
- `created_at` / `updated_at`

---

## 4. `session_exercise_groups` (세션 운동 그룹)

슈퍼세트/라운드(서킷)처럼 세션 안에서 연속된 운동들을 하나의 그룹으로 묶는 UI 객체입니다. 그룹은 운동 행 자체가 아니라 세션 안의 범위를 가리키므로, 빈 그룹이나 중복 이름 문제 없이 이름/크기/위치를 독립적으로 저장할 수 있습니다.

- `id` (UUID, PK)
- `session_id` (UUID, FK → `sessions.id`)
- `name` (String): 그룹명 (예: "슈퍼세트 A", "서킷 1")
- `start_order` (Int): 그룹이 시작되는 세션 내 운동 순서
- `size` (Int): 그룹에 포함되는 연속 운동 개수
- `color` (String): 그룹 표시 색상. 세션 내에서 생성 순서에 따라 최대 4개의 고정 팔레트 색상을 배정합니다.
- `created_at` / `updated_at`

> 그룹은 세션당 최대 4개이며, 서로 겹칠 수 없습니다. 그룹 범위에 포함된 운동들의 `target_sets`는 앱 로직에서 동일하게 동기화합니다.

---

## 5. `exercises` (운동 종목 마스터)

앱 전체에서 공유되는 운동 종목 목록입니다. 기본 제공 운동과 유저 커스텀 운동이 혼재합니다.

- `id` (UUID, PK)
- `name` (String): 운동 한글명 (예: "벤치프레스", "플랭크")
- `englishName` (String, Nullable): 운동 영문명 (예: "Bench Press", "Plank"). 커스텀 운동은 Null 가능
- `primaryMuscle` (String): 대표 주동근 (예: "대흉근", "대퇴사두", "광배근")
- `secondaryMuscles` (String[]): 보조근 목록 (예: ["삼각근", "상완삼두근"]). 없으면 빈 배열
- `equipment` (String): 사용 장비 (예: "바벨", "덤벨", "맨몸", "케틀벨", "밴드", "기타")
- `category` (String): 운동 유형. `strength` / `stretching` / `cardio` / `plyometrics` / `powerlifting` 중 하나
- `unit` (String): 기록 단위. `kg` / `reps` / `sec` 중 하나
- `is_unilateral` (Boolean): 편측성 운동 여부 (기본값 `false`)
- `synonyms` (String[]): 자동완성 검색용 동의어 목록 (한글 줄임말, 영문명 등). 없으면 빈 배열
- `user_id` (String, Nullable): 유저가 커스텀으로 추가한 경우 유저 ID. 기본 제공 운동은 Null
- `created_at` / `updated_at`

### 운동 데이터베이스 분류 및 검증 표준

운동 사전(`src/data/exerciseDictionary.js`)과 추출 원본(`scratch/extracted_exercises.json`)은 전체 873개 운동 목록을 완벽하게 공유하며 상호 정합성(Sync)이 유지됩니다.

#### 1. 한글화 및 번역 표준 (Translation Standards)
- 어색한 직역이나 영문 단어가 혼재되지 않은 **자연스러운 한글 헬스 용어** 사용을 원칙으로 합니다.
- **영어 단어 표기 제한**: `EZ`, `SMR`, `T바`, `V바`, `JM` 등 피트니스 커뮤니티에서 통용되는 표준 약어/아크로님 외의 일반 영어 단어(`Circles`, `Against`, `Rollout` 등)는 명칭 내에 노출할 수 없으며 전부 표준 한국어 표현으로 번역하여 정제해야 합니다.
  - *예*: `앵클 Circles` ➔ `발목 돌리기`, `바벨 Rollout` ➔ `바벨 롤아웃`, `Bicycling Stationary` ➔ `실내 자전거`
- **동의어 표준**: `synonyms` 배열의 **첫 번째 원소(index 0)는 항상 운동의 한글 `name`**이어야 하며, 검색 최적화용 동의어 목록(초성 검색 포함)은 중복이 없는 순수한 유니크 배열 상태를 유지합니다.

#### 2. 근육명 표준 (Muscle Standards)
대표 주동근(`primaryMuscle`) 및 보조근(`secondaryMuscles`) 목록은 설명형 라벨(예: "허벅지 앞") 대신 해부학적 표준 명칭을 사용하여 저장합니다.
- **허용 근육 표준 목록 (17개)**:
  `대흉근`, `광배근`, `승모근`, `삼각근`, `상완이두근`, `상완삼두근`, `전완근`, `복근`, `척추기립근`, `둔근`, `대퇴사두`, `햄스트링`, `내전근`, `외전근`, `하퇴삼두근`, `경부근`, `기타`
- `primaryMuscle`과 `secondaryMuscles` 간에 중복된 근육이 포함되어서는 안 됩니다.

#### 3. 장비명 표준 (Equipment Standards)
사용 장비(`equipment`)는 다음 12개의 표준값만을 가집니다.
- **허용 장비 표준 목록 (12개)**:
  `맨몸`, `바벨`, `덤벨`, `머신`, `케틀벨`, `밴드`, `케이블`, `폼롤러`, `짐볼`, `메디신볼`, `e-z curl bar`, `기타`

#### 4. 카테고리 표준 (Category Standards)
운동 유형(`category`)은 데이터베이스 정합성을 위해 다음 5개 분류로 엄격하게 통일합니다.
- **허용 카테고리 목록 (5개)**:
  `strength` (근력 운동), `stretching` (스트레칭), `cardio` (유산소), `plyometrics` (플라이오메트릭), `powerlifting` (파워리프팅)
- *주의*: 원본 데이터의 `olympic weightlifting`(역도) 및 `strongman` 운동은 모두 `strength`로 정합 재분류하여 처리합니다.

#### 5. 측정 단위 표준 (Unit Standards)
운동 진행 시 세트별 목표치 기록 단위(`unit`)는 카테고리와 성격에 맞춰 다음과 같이 적용합니다.
- `sec` (초): `stretching` 전체 종목, 유산소(`cardio`) 일부 종목, 버티는 정적 코어 운동(예: 플랭크, 홀드).
- `reps` (회): 맨몸 근력 운동(`맨몸` + `strength` / `plyometrics`).
- `kg` (무게): 중량/기구 근력 운동(`바벨`, `덤벨`, `머신`, `케이블` 등 + `strength` / `powerlifting`).

#### 6. 편측성 운동 표준 (Unilateral Standards)
- 좌/우 운동을 별도로 기록하고 관리해야 하는 모든 종목(예: 싱글레그 스쿼트, 런지, 스텝업, 얼터네이트 덤벨 컬, 원암 로우 등)은 반드시 `is_unilateral: true`로 지정합니다.
- 양측성(Bilateral) 근력 운동에는 `is_unilateral: false`를 지정하며, 편측성 관련 동의어가 synonyms에 실수로 유입되지 않도록 교차 검수해야 합니다.

---

## 6. `workout_logs` (일일 운동 수행 기록)

유저가 실제로 운동을 수행한 날의 기록입니다. 어떤 세션을 기반으로 운동했는지 참조합니다. (세션 필수 지정)

일일 로그가 필요한 이유: 같은 세션 템플릿을 여러 날에 반복 수행하므로, 수행 시점(날짜/시간)과 세션 템플릿을 분리해서 저장해야 히스토리 추적이 가능합니다.

- `id` (UUID, PK)
- `user_id` (String)
- `session_id` (UUID, FK → `sessions.id`): 기반 세션 (NOT NULL)
- `start_time` (Timestamp): 운동 시작 시간
- `end_time` (Timestamp, Nullable): 운동 종료 시간 (진행 중 Null)
- `created_at` / `updated_at`

---

## 7. `set_records` (세트별 수행 기록)

일일 로그 내에서 개별 운동의 세트별 실제 수행 결과를 기록합니다.

- `id` (UUID, PK)
- `workout_log_id` (UUID, FK → `workout_logs.id`)
- `exercise_id` (UUID, FK → `exercises.id`)
- `set_number` (Int): 세트 번호 (1, 2, 3...)
- `weight` (Float, Nullable): 수행 무게 (기본 단위: kg, 맨몸 운동 시 Null 또는 0)
- `record` (String or Int): 수행 기록 (횟수 또는 시간(초), 단순 숫자로 저장)
- `side` (String): 수행 방향 ('L', 'R', 'both' 중 하나, 기본값 'both')
- `memo` (String, Nullable): 세트별 메모 (예: "너무 무거움")
- `created_at` / `updated_at`
