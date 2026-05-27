# GridSet DB Schema (MVP 확정안)

향후 Supabase(PostgreSQL) 전환을 고려하여 `id`는 **UUID**를 사용하며, 테이블 구조를 극도로 단순화하여 로컬 스토리지(Zustand Persist) 구현에 용이하게 설계되었습니다.

## 1. `exercises` (운동 종목)
부위/장비 등의 정보 없이 오직 이름만 존재하는 심플한 구조입니다. 앱에서 기본 리스트를 시드 데이터로 제공하고, 나머지는 유저가 직접 입력해 추가합니다.
- `id` (UUID, PK)
- `name` (String): 운동 이름 (예: 벤치프레스, 플랭크, 사레레 등)
- `unit` (String): 기록 단위 (예: 'kg', 'reps', 'sec')
- `user_id` (String, Nullable): 유저가 커스텀으로 추가한 경우 유저 ID (기본 제공 운동은 Null)
- `created_at` / `updated_at`

## 2. `routines` (루틴)
유저가 만든 루틴 템플릿의 껍데기입니다.
- `id` (UUID, PK)
- `name` (String): 루틴명 (예: "가슴 폭파 루틴")
- `user_id` (String)
- `created_at` / `updated_at`

## 3. `routine_exercises` (루틴별 운동)
루틴에 어떤 운동이 몇 세트/몇 회 목표로 들어가는지 정의합니다. (목표 무게 제외)
- `id` (UUID, PK)
- `routine_id` (UUID, FK -> `routines.id`)
- `exercise_id` (UUID, FK -> `exercises.id`)
- `order` (Int): 루틴 내 운동 순서
- `target_sets` (Int): 목표 세트 수 (예: 4)
- `target_record` (String or Int): 목표 기록 (횟수 또는 시간(초) 등 단순 숫자, 예: 10)
- `created_at` / `updated_at`

## 4. `workout_logs` (일일 로그)
실제 운동을 수행한 세션(Session) 기록입니다.
- `id` (UUID, PK)
- `user_id` (String)
- `routine_id` (UUID, Nullable, FK -> `routines.id`): 루틴 없이 자유 운동 시 Null
- `start_time` (Timestamp): 운동 시작 시간
- `end_time` (Timestamp, Nullable): 운동 종료 시간 (진행 중일 땐 Null)
- `created_at` / `updated_at`

## 5. `set_records` (세트 기록)
개별 운동의 세트별 수행 결과입니다.
- `id` (UUID, PK)
- `workout_log_id` (UUID, FK -> `workout_logs.id`)
- `exercise_id` (UUID, FK -> `exercises.id`)
- `set_number` (Int): 세트 번호 (1, 2, 3...)
- `weight` (Float, Nullable): 수행 무게 (기본 단위: kg, 맨몸 운동 시 Null 또는 0)
- `record` (String or Int): 수행 기록 (횟수 또는 시간(초). 단순 숫자로 저장)
- `is_completed` (Boolean): UI 상에서 세트 완료 체크 여부
- `memo` (String, Nullable): 해당 세트에 대한 메모 (예: "너무 무거움")
- `created_at` / `updated_at`
