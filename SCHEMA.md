# GridSet DB Schema (MVP 확정안)

향후 Supabase(PostgreSQL) 전환을 고려하여 `id`는 **UUID**를 사용하며, 테이블 구조를 극도로 단순화하여 로컬 스토리지(Zustand Persist) 구현에 용이하게 설계되었습니다.

---

## 개념 구조

```
routines (루틴 - 주간 운동 계획)
  └── sessions (세션 - 하루치 운동 계획, 1:N)
        └── session_exercises (세션↔운동 매핑, M:N 중간 테이블)
              └── exercises (운동 종목 마스터)

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
- `session_order` (Int): 루틴 내에서의 세션 순서 (1, 2, 3...)
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
- `created_at` / `updated_at`

---

## 4. `exercises` (운동 종목 마스터)

앱 전체에서 공유되는 운동 종목 목록입니다. 기본 제공 운동과 유저 커스텀 운동이 혼재합니다.

- `id` (UUID, PK)
- `name` (String): 운동 한글명 (예: "벤치프레스", "플랭크")
- `englishName` (String, Nullable): 운동 영문명 (예: "Bench Press", "Plank"). 커스텀 운동은 Null 가능
- `primaryMuscle` (String): 주동근 (예: "가슴", "대퇴사두")
- `secondaryMuscles` (String[]): 보조근 목록 (예: ["어깨", "삼두"]). 없으면 빈 배열
- `equipment` (String): 사용 장비 (예: "바벨", "덤벨", "맨몸", "케틀벨", "밴드", "기타")
- `category` (String): 운동 유형. `strength` / `stretching` / `cardio` / `plyometrics` / `powerlifting` 중 하나
- `unit` (String): 기록 단위. `kg` / `reps` / `sec` 중 하나
- `synonyms` (String[]): 자동완성 검색용 동의어 목록 (한글 줄임말, 영문명 등). 없으면 빈 배열
- `user_id` (String, Nullable): 유저가 커스텀으로 추가한 경우 유저 ID. 기본 제공 운동은 Null
- `created_at` / `updated_at`

---

## 5. `workout_logs` (일일 운동 수행 기록)

유저가 실제로 운동을 수행한 날의 기록입니다. 어떤 세션을 기반으로 운동했는지 참조하며, 자유 운동(세션 미지정)도 지원합니다.

일일 로그가 필요한 이유: 같은 세션 템플릿을 여러 날에 반복 수행하므로, 수행 시점(날짜/시간)과 세션 템플릿을 분리해서 저장해야 히스토리 추적이 가능합니다.

- `id` (UUID, PK)
- `user_id` (String)
- `session_id` (UUID, Nullable, FK → `sessions.id`): 기반 세션 (자유 운동 시 Null)
- `start_time` (Timestamp): 운동 시작 시간
- `end_time` (Timestamp, Nullable): 운동 종료 시간 (진행 중 Null)
- `created_at` / `updated_at`

---

## 6. `set_records` (세트별 수행 기록)

일일 로그 내에서 개별 운동의 세트별 실제 수행 결과를 기록합니다.

- `id` (UUID, PK)
- `workout_log_id` (UUID, FK → `workout_logs.id`)
- `exercise_id` (UUID, FK → `exercises.id`)
- `set_number` (Int): 세트 번호 (1, 2, 3...)
- `weight` (Float, Nullable): 수행 무게 (기본 단위: kg, 맨몸 운동 시 Null 또는 0)
- `record` (String or Int): 수행 기록 (횟수 또는 시간(초), 단순 숫자로 저장)
- `is_completed` (Boolean): UI 상에서 세트 완료 체크 여부
- `memo` (String, Nullable): 세트별 메모 (예: "너무 무거움")
- `created_at` / `updated_at`
