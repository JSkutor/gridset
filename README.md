# ⚡ GridSet

> **MacBook 및 노트북 환경에 최적화된, 마우스가 필요 없는 데스크톱 전용 스프레드시트형 운동 일지 웹 앱**  
> _A desktop-first, keyboard-driven workout logging web app optimized for keyboard-only input._

[![React 19](https://img.shields.io/badge/React-19.x-blue.svg?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5.x-brown.svg)](https://github.com/pmndrs/zustand)
[![Supabase](https://img.shields.io/badge/Supabase-Database--Auth-green.svg?logo=supabase&logoColor=white)](https://supabase.com)
[![Vitest](https://img.shields.io/badge/Vitest-3.x-yellow.svg?logo=vitest&logoColor=white)](https://vitest.dev)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-45ba4b.svg?logo=playwright&logoColor=white)](https://playwright.dev)
[![License: GPL v3](https://img.shields.io/badge/License-GPL_v3-blue.svg)](LICENSE)

---

## 🌟 GridSet 소개

GridSet은 **데스크톱 환경의 키보드 입력 속도**에 최적화된 운동 일지 애플리케이션입니다. 스프레드시트를 다루듯 빠르게 운동 기록을 입력하고 체계적으로 관리합니다.

### 🎯 핵심 설계 철학

1. **마우스가 필요 없는 워크플로우 (Keyboard-Driven)**: 키보드 단축키와 방향키, Tab/Enter만으로 운동 루틴 설계, 실제 세트 기록 기입, 휴식 타이머 제어, 기록 완료 및 저장까지 모든 흐름을 매끄럽게 제어할 수 있습니다.
2. **풍부한 데스크톱 UI (Rich Aesthetics)**: Dark 테마, 글래스모피즘 패널, 세밀한 그라데이션과 마이크로 인터랙션으로 네이티브 앱 수준의 경험을 제공합니다.
3. **오프라인 퍼스트 & 안전한 동기화 (Offline-First)**: 로그인 없이 실행하는 **"로컬 게스트 모드"**를 지원(브라우저 `localStorage` 기반 영구 저장)하며, 계정을 연동하면 Supabase 서버 기록을 기준으로 안전하게 동기화합니다.

---

## ✨ 주요 기능 및 특징

### 🏋️ 1. 스프레드시트 세트 그리드 (Set 페이지 — `W`)

- **Excel 감각의 그리드 키보드 내비게이션**: 마우스 클릭 없이 방향키로 셀을 이동하고 `Enter` 키로 다음 세트 입력 행으로 이동합니다.
- **편측성 운동(Unilateral) 지원**: 좌/우 세트를 독립적으로 기록하고 각각 렌더링합니다.
- **자동 휴식 타이머 (Rest Timer)**: 세트 기록 입력을 완료하면 실시간으로 오버레이 휴식 타이머가 활성화되며, 다음 세트 전까지의 잔여 시간을 아날로그 게이지 형태로 추적합니다. 일시 정지(Pause) 및 해제(Dismiss)를 지원합니다.
- **운동 정보 및 히스토리 패널**: 좌측에 운동 정보(주동근, 장비, 단위), 하단에 지난 세션 기록을 표시합니다.
- **세트 메모**: `` ` `` / `₩` 키로 그리드 셀과 메모 입력을 전환하며 세트별 메모를 기록할 수 있습니다.
- **세션 선택기 (Session Selector)**: 최신 루틴의 모든 세션을 드롭다운으로 빠르게 전환하며, 다음 예정된 세션(최근 수행 기준 자동 로테이션)이 기본 선택됩니다.
- **운동 완료 모달 (Completion Modal)**: 세션 저장 시 컨페티 애니메이션, 총 볼륨·세트·횟수·최고 중량 통계, 운동별 Best Set 및 점진적 과부하(PR) 분석, 세션 소요 시간을 한눈에 확인합니다.

### ⚙️ 2. 루틴 및 세션 플래너 (Routine 페이지 — `Q`)

- **주간 운동 템플릿 설계**: 세션(`Day A`, `Day B`, …, 최대 7개)을 커스텀 정의하고 운동 종목을 할당합니다. **생성일 기준 최신 루틴만 편집 가능**하며 오래된 루틴은 읽기 전용입니다.
- **키보드 중심의 순서 정렬**: 드래그 앤 드롭 없이 `Cmd/Ctrl + Arrow Up/Down` 조작만으로 세션 순서와 운동 순서를 즉각적이고 영구적으로 재배치합니다.
- **목표 가이드라인 설정 패널 (Settings Panel)**: 각 운동마다 목표 세트 수, 타겟 횟수(Reps) 또는 시간(Sec), 세트 간 휴식(Rest Between Sets), 운동 간 휴식(Rest After Exercise)을 우측 패널에서 개별 제어합니다.
- **운동 그룹 (Superset / Circuit)**: 세션당 최대 4개까지 연속 운동을 그룹으로 묶습니다. 그룹 내 모든 운동은 **목표 세트 수, 세트 간 휴식, 운동 간 휴식**을 공유하며, 그룹 시작 순서와 크기를 변경할 수 있습니다.
- **임시 세션 (Temporary Session)**: 루틴에 하나의 임시 세션(order=0)을 추가할 수 있어, 사전 정의되지 않은 운동도 자유롭게 수행하고 기록할 수 있습니다.
- **루틴 복제 (Duplicate)**: 기존 루틴의 모든 하위 세션, 운동 세팅, 그룹을 원클릭으로 복사합니다.
- **초성 한글 매칭 운동 검색**: `ExerciseAutocomplete`가 자음만 입력해도(`ㅂㅊ` → 벤치프레스) 고속 자동 완성됩니다.

### 📊 3. 다차원 로그 분석 (Log 페이지 — `E`)

- **달력 기반 일일 로그 (Daily — `A`)**: 월간 달력에서 운동 기록이 있는 날짜를 색상 마커로 표시하고, 선택한 날짜의 운동 기록·세트 수·소요 시간을 확인합니다. 운동별 Best Set 및 메모도 함께 표시됩니다.
- **운동별 추이 차트 (Exercise — `S`)**: 종목별 Peak Weight 및 볼륨 추이를 라인 차트로 렌더링하며, 해당 종목의 전체 세트 기록을 최신순으로 조회합니다.
- **루틴 타임라인 (Routine — `D`)**: 루틴 템플릿별 생성일부터 최근 수행일까지의 히스토리와 세션별 활동 비율을 타임라인 형태로 시각화합니다.

### 🔐 4. 계정 및 동기화

- **게스트 / 로그인 이중 모드**: `.env.local` 없이도 로컬에서 전 기능을 사용할 수 있습니다. 게스트 데이터는 브라우저 `localStorage`에 영구 저장됩니다.
- **스마트 로그인 동기화 정책**: 로그인 시 서버가 비어 있고 게스트가 데모 데이터를 정리했다면 게스트 데이터를 서버에 업로드합니다. 그 외에는 항상 서버 데이터를 기준으로 클라이언트를 덮어씁니다.
- **자동 재시도 큐 (Remote Sync Queue)**: 모든 Supabase 쓰기 요청은 실패 시 최대 3회 자동 재시도됩니다. 400번대 에러(404, 409 등)는 재시도 없이 폐기됩니다. 동일 리소스에 대한 연속(dedupKey 기반) 요청은 최신 요청만 유지됩니다.
- **동기화 상태 배너 (SyncStatusBanner)**: 상단 우측에 동기화 오류·재시도 상태를 배너로 표시합니다.
- **데모 데이터 관리**: 게스트 첫 실행 시 3개 기본 루틴과 8주 치 더미 기록이 자동 생성됩니다. `샘플 기록 지우기` 버튼으로 원클릭 초기화 가능합니다.
- **도움말 (HelpModal)**: 우측 상단 버튼에서 전체 단축키 목록, 데모 데이터 생성, 전체 데이터 초기화를 수행할 수 있습니다.

---

## ⌨️ 키보드 단축키 (Shortcut Reference)

기본 포커스를 잃었거나 어떤 인풋 영역에 갇혔다면 `Escape`를 눌러 일반 조작 모드로 복귀한 뒤 아래 단축키를 활용하세요. 한국어 키보드에서는 `` ` `` 대신 `₩` 키로 동일하게 동작합니다.

> 상세 명세는 [docs/KEYBOARD_UX.md](docs/KEYBOARD_UX.md)를 참고하세요.

### 1. 글로벌 네비게이션 (앱 전체)

| 단축키        | 기능                                                                             |
| :------------ | :------------------------------------------------------------------------------- |
| `Q`           | **Routine** 페이지로 화면 전환                                                   |
| `W`           | **Set** 페이지로 화면 전환 _(기본)_                                              |
| `E`           | **Log** 페이지로 화면 전환                                                       |
| `` ` `` / `₩` | **[포커스 토글]** Set: 그리드 셀 ↔ 세트 메모 / Routine: 세션 운동 첫 행으로 진입 |
| `Escape`      | 현재 포커스된 입력창 해제(Blur) → 단일키 단축키 모드로 복귀                      |

### 2. 스프레드시트 그리드 (Set 페이지)

| 단축키               | 기능                                                          |
| :------------------- | :------------------------------------------------------------ |
| `Arrow Up / Down`    | 동일 열의 위/아래 입력 셀로 포커스 이동                       |
| `Enter`              | 기록 값을 반영하고 아래 행 셀로 수직 이동                     |
| `Tab`                | 오른쪽 인접 열 셀로 이동 (행 끝 도달 시 다음 행 첫 열로 이동) |
| `Shift + Tab`        | 왼쪽 인접 열 셀로 역방향 이동                                 |
| `Arrow Left / Right` | 인풋 커서가 맨 앞/뒤일 때 좌/우 열 셀로 이동                  |

### 3. 루틴 구성기 (Routine 페이지)

| 단축키                     | 기능                                                    |
| :------------------------- | :------------------------------------------------------ |
| `Arrow Up / Down`          | 좌측 세션 목록 / 중앙 운동 리스트 수직 탐색             |
| `Cmd` / `Ctrl` + `↑` / `↓` | 포커스된 세션·운동 순서 변경 (또는 설정 패널 수치 조절) |
| `Arrow Right`              | 운동 포커스 상태에서 우측 세부 설정 패널로 진입         |
| `Arrow Left`               | 설정 패널 인풋에서 좌측 운동 목록 행으로 복귀           |
| `Enter` / `Space`          | 세션 또는 운동 아이템 선택 상태 토글                    |

### 4. 로그 분석 (Log 페이지)

| 단축키 | 기능                          |
| :----- | :---------------------------- |
| `A`    | **일일 로그 (Daily)** 뷰      |
| `S`    | **운동별 추이 (Exercise)** 뷰 |
| `D`    | **루틴 로그 (Routine)** 뷰    |

---

## 🛠️ 기술 스택 (Tech Stack)

| 계층                 | 기술                                                                               |
| :------------------- | :--------------------------------------------------------------------------------- |
| **프레임워크**       | React 19 (StrictMode, Functional Components, Custom Hooks)                         |
| **빌더**             | Vite 8 (HMR)                                                                       |
| **상태 관리**        | Zustand 5 + `persist` 미들웨어 (4개 슬라이스: auth, exercise, routine, workoutLog) |
| **DB & Auth**        | Supabase (PostgreSQL, Row Level Security, Session Auth)                            |
| **아이콘**           | Lucide React                                                                       |
| **모션**             | Framer Motion — 세트 행 애니메이션, Confetti 캔버스 파티클                         |
| **DOM 애니메이션**   | `@formkit/auto-animate` — 리스트 자동 애니메이션                                   |
| **스타일**           | Vanilla CSS (CSS Custom Properties, CSS Grid, Glassmorphism, View Transitions API) |
| **단위/통합 테스트** | Vitest 3 + React Testing Library + JSDOM                                           |
| **E2E 테스트**       | Playwright                                                                         |
| **린터**             | ESLint 10 (React Hooks, React Refresh 플러그인)                                    |

---

## 📂 프로젝트 폴더 구조

```text
gridset/
├── docs/                            # 개발 표준 및 기술 문서
│   ├── KEYBOARD_UX.md               # 키보드 UX 전체 명세
│   ├── SCHEMA.md                    # DB 스키마 정의
│   ├── REQUIREMENTS.md              # 요구사항 및 로드맵
│   └── git_*.md                     # Git 브랜치·커밋 컨벤션
├── scratch/                         # DB DDL, 운동 마스터 JSON, Seed 스크립트
│   ├── extracted_exercises.json     # 875종 운동 카탈로그 (러닝타임 소스)
│   ├── supabase_schema.sql          # 테이블·RLS DDL
│   └── supabase_seed_default_exercises.sql
├── tests/                           # Playwright E2E 스펙
│   ├── navigation.spec.js
│   ├── routineHoverLeak.spec.js
│   └── sessionGrouping.spec.js
├── src/
│   ├── api/                         # Supabase 리포지토리
│   │   └── supabaseWorkoutRepository.js
│   ├── components/                  # UI 컴포넌트
│   │   ├── routine/                 # Routine 탭 (세션·운동·그룹 편집)
│   │   ├── log/                     # Log 탭 (달력·차트·타임라인)
│   │   ├── WorkoutGrid.jsx          # Set 탭 스프레드시트 그리드
│   │   ├── WorkoutCompletionModal.jsx # 운동 완료 요약 모달
│   │   ├── AuthModal.jsx            # 로그인·회원가입
│   │   ├── AccountMenu.jsx          # 계정·동기화 메뉴
│   │   ├── DemoClearAction.jsx      # 데모 데이터 삭제 버튼
│   │   ├── SyncStatusBanner.jsx     # 동기화 상태 배너
│   │   └── HelpModal.jsx            # 단축키·데이터 관리
│   ├── hooks/                       # 커스텀 훅
│   │   ├── useGlobalShortcuts.js    # 전역 단축키 (Escape, Backtick 등)
│   │   ├── useTabNavigation.js      # Tab 내비게이션 (Q/W/E, A/S/D)
│   │   ├── useGridNavigation.js     # Set 그리드 키보드 내비게이션
│   │   ├── useWorkoutDraft.js       # 세트 기록 초안 관리
│   │   ├── useWorkoutSessionRotation.js # 세션 자동 로테이션
│   │   ├── useAuthSessionBridge.js  # Supabase Auth ↔ Zustand 브릿지
│   │   ├── useViewTransition.js     # View Transitions API 래퍼
│   │   ├── useRoutineDetailActions.js # 루틴 CRUD 액션
│   │   ├── useRoutineKeyboardNavigation.js # 루틴 키보드 내비게이션
│   │   └── useIsKeyboardNavigating.js  # 키보드/마우스 구분
│   ├── store/                       # Zustand 상태 관리
│   │   ├── slices/                  # 슬라이스 분할
│   │   │   ├── authSlice.js         # 인증·동기화·게스트 모드
│   │   │   ├── exerciseSlice.js     # 운동 CRUD
│   │   │   ├── routineSlice.js      # 루틴·세션·운동 그룹 CRUD
│   │   │   └── workoutLogSlice.js   # 운동 기록·세트 레코드 CRUD
│   │   ├── useWorkoutStore.js       # Zustand persist 스토어
│   │   └── workoutPersistenceMigration.ts # v1~v11 마이그레이션
│   ├── utils/                       # 순수 유틸리티 함수
│   │   ├── hangul.js                # 한글 초성 분해 엔진
│   │   ├── exerciseSearch.js        # 초성 검색·자동 완성
│   │   ├── setGridModel.js          # 그리드 row/block 모델링
│   │   ├── sessionHelper.js         # 세션·루틴 유틸리티
│   │   ├── sessionExerciseGroups.js # 운동 그룹 연산
│   │   ├── logFormatters.js         # 로그 포매터·달력 유틸
│   │   ├── logSummaries.js          # 로그 요약·차트 데이터 빌더
│   │   └── supabaseClient.js        # Supabase 클라이언트 초기화
│   ├── data/
│   │   ├── exerciseDictionary.js    # 875종 운동 사전
│   │   ├── dummyGenerator.js        # 데모 데이터 생성기
│   │   └── muscleGroups.js          # 주동근 정규화
│   ├── constants/
│   │   └── appNavTabs.js            # Q/W/E 탭 상수
│   ├── styles/                      # Vanilla CSS (토큰 기반)
│   ├── App.jsx                      # 앱 루트 (3-Tab 라우팅)
│   └── main.jsx                     # React 19 진입점
├── playwright.config.js
├── vite.config.js
└── package.json
```

---

## 🚀 로컬 개발 셋업 (Getting Started)

### 1. 소스 클론 및 의존성 다운로드

```bash
git clone https://github.com/JSkutor/gridset.git
cd gridset
npm install
```

### 2. 환경 변수 설정 (선택 사항 — 없어도 로컬 게스트 모드로 전체 기능 사용 가능)

프로젝트 루트에 `.env.local` 파일을 만들고 Supabase 자격 증명을 작성합니다.

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> [!NOTE]
> `.env.local`이 없거나 플레이스홀더 값이면 **로컬 게스트 모드**로 동작합니다. 로그인·원격 동기화 없이도 모든 기능을 테스트할 수 있습니다.

### 3. 로컬 서버 구동

```bash
# 개발 서버 (기본 포트: 5173)
npm run dev

# 프로덕션 빌드 및 미리보기
npm run build
npm run preview
```

### 4. 테스트 실행

```bash
# Vitest 단위·통합 테스트
npm run test

# Vitest watch 모드
npm run test:watch

# Playwright E2E (dev 서버가 5173에서 실행 중이어야 함)
npm run test:e2e

# Playwright UI 모드
npm run test:e2e:ui

# ESLint 검사
npm run lint
```

---

## 💾 Supabase 백엔드 구축

원격 동기화 및 인증을 사용하려면 Supabase 프로젝트에서 [scratch/supabase_schema.sql](scratch/supabase_schema.sql)과 [scratch/supabase_seed_default_exercises.sql](scratch/supabase_seed_default_exercises.sql)을 순서대로 실행하세요. 발급된 API URL과 Anon 키를 `.env.local`에 설정하면 로그인과 원격 동기화가 활성화됩니다.

---

## 🤝 기여 가이드

버그 제보, 단축키 개선, 기능 제안은 **GitHub Issue**로 등록해 주세요. PR 제출 전 `npm run test`와 `npm run lint` 통과를 확인해 주세요. 자세한 브랜치/커밋 컨벤션은 [`docs/`](docs/)를 참고하세요.

---

## 📄 라이선스 (License)

This project is licensed under the **GNU GPLv3** — see the [LICENSE](LICENSE) file for details.
