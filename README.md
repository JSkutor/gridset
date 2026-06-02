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
- **데이터보내기**: 계정 메뉴에서 루틴·세션·운동·로그·세트 기록을 ZIP(CSV 묶음)으로 다운로드할 수 있습니다.

---

## ⚡ 초기 로딩이 무거운 이유

프로덕션 빌드(`npm run build`) 기준 대략 **JS ~1.1MB (gzip ~290KB)**, **CSS ~80KB**가 **단일 청크**로 한 번에 내려받습니다. Vite가 코드 스플리팅을 쓰지 않고, `App.jsx`가 Routine / Set / Log 화면을 모두 정적 import하기 때문입니다.

| 원인 | 설명 |
| :--- | :--- |
| **875종 운동 사전** | `src/data/exerciseDictionary.ts`(~440KB 소스)가 번들에 인라인됩니다. 스토어 초기화·마이그레이션·검색·Supabase 동기화가 모두 이 카탈로그에 의존해 **첫 페인트 전에 필수**입니다. |
| **데모 시드** | 게스트 첫 실행 시 `dummyGenerator`가 8주치 더미 루틴/로그를 만들며, `localStorage` hydrate 비용이 추가됩니다. |
| **항상 로드되는 라이브러리** | React 19, Zustand, Supabase 클라이언트, Framer Motion, JSZip(데이터보내기) 등이 탭을 나눠도 분리되지 않습니다. |
| **탭 지연 로딩 없음** | Log 차트·Routine 편집 UI도 Set 탭만 쓸 때와 동일 번들에 포함됩니다. |

체감 속도를 올리려면 (향후) 운동 사전 JSON lazy fetch, `React.lazy`로 탭·보내기 분리, JSZip dynamic import 등이 효과적입니다. 자세한 제품/기술 메모는 [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) §13을 참고하세요.

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
| **모션**             | Framer Motion — 루틴 리스트·세트 행 애니메이션, 완료 모달 Confetti               |
| **언어**             | TypeScript (점진 도입: `store`, `api`, `utils`, `data`, 주요 `hooks`는 TS)         |
| **스타일**           | Vanilla CSS (CSS Custom Properties, CSS Grid, Glassmorphism, View Transitions API) |
| **단위/통합 테스트** | Vitest 3 + React Testing Library + JSDOM                                           |
| **E2E 테스트**       | Playwright                                                                         |
| **품질**             | ESLint 10, `tsc --noEmit` (`npm run typecheck`)                                    |

---

## 📂 프로젝트 폴더 구조

```text
gridset/
├── docs/
│   ├── KEYBOARD_UX.md               # 키보드 UX 명세
│   ├── SCHEMA.md                    # DB 스키마·Supabase 운영 메모
│   ├── REQUIREMENTS.md              # 요구사항·로드맵·성능 메모
│   ├── SYNC_POLICY.md               # 게스트↔서버 동기화 정책
│   ├── migrations/                  # 증분 SQL (예: session_exercise_groups)
│   └── git_*.md                     # 브랜치·커밋 컨벤션
├── scratch/                         # DDL·시드·사전 생성용 원본
│   ├── extracted_exercises.json     # 사전 생성 소스 (런타임은 exerciseDictionary.ts)
│   ├── supabase_schema.sql
│   └── supabase_seed_default_exercises.sql
├── tests/                           # Playwright E2E
├── src/
│   ├── api/
│   │   └── supabaseWorkoutRepository.ts
│   ├── components/                  # 대부분 .jsx (Routine/Log/Set UI)
│   ├── hooks/                       # .ts + routine용 .js 일부
│   ├── store/
│   │   ├── slices/                  # auth, exercise, routine, workoutLog (.ts)
│   │   ├── useWorkoutStore.ts
│   │   ├── types.ts
│   │   └── workoutPersistenceMigration.ts  # persist v1 (pass-through)
│   ├── utils/                       # hangul, setGridModel, logSummaries 등 (.ts)
│   ├── data/
│   │   ├── exerciseDictionary.ts    # 875종 오프라인 사전 (번들 대부분)
│   │   ├── dummyGenerator.ts
│   │   └── muscleGroups.ts
│   ├── types/
│   ├── constants/
│   │   └── appNavTabs.ts
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── playwright.config.js
├── tsconfig.json
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

# TypeScript 타입 검사
npm run typecheck
```

---

## 🌐 배포 (Deployment)

GridSet은 **Vite 정적 SPA**(`dist/`)입니다. 서버 사이드 렌더링은 없고, 클라이언트 라우팅은 탭 전환이므로 **모든 경로를 `index.html`로 fallback**하면 됩니다.

### 호스팅 추천: **Vercel** (1순위)

| 플랫폼 | GridSet에 맞는 정도 | 메모 |
| :--- | :--- | :--- |
| **Vercel** | **추천** | Vite/React 기본 지원, Git 연동·프리뷰 URL, `VITE_*` env, SPA rewrite 한 줄 설정. 무료 티어로 개인 프로젝트 배포에 충분. |
| **Netlify** | 동등하게 가능 | Vercel과 유사. `netlify.toml`로 build/`dist`·redirect 설정. 팀이 Netlify에 익숙하면 선택 가능. |
| **GitHub Pages** | 가능하나 비추천 | `base` 경로(`username.github.io/repo/`) 설정·Actions 수동 구성·프리뷰 env 관리가 번거롭고, Supabase env를 브랜치별로 나누기 어렵다. |

**Vercel 최소 설정 예시**

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (게스트만 쓸 경우 생략 가능)
- SPA: 프로젝트에 `vercel.json`이 없으면 Vercel이 Vite를 감지해 보통 자동 처리. 필요 시:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

배포 전 Supabase 스키마는 [docs/SCHEMA.md](docs/SCHEMA.md)의 운영 메모를 따르세요. `session_exercise_groups` 등 증분 SQL이 원격 DB에 반영돼 있어야 로그인 사용자의 루틴 그룹이 정상 동작합니다.

---

## 💾 Supabase 백엔드 구축

원격 동기화 및 인증을 사용하려면 Supabase 프로젝트에서 [scratch/supabase_schema.sql](scratch/supabase_schema.sql)과 [scratch/supabase_seed_default_exercises.sql](scratch/supabase_seed_default_exercises.sql)을 순서대로 실행하세요. 발급된 API URL과 Anon 키를 `.env.local`에 설정하면 로그인과 원격 동기화가 활성화됩니다.

---

## 🤝 기여 가이드

버그 제보, 단축키 개선, 기능 제안은 **GitHub Issue**로 등록해 주세요. PR 제출 전 `npm run test`와 `npm run lint` 통과를 확인해 주세요. 자세한 브랜치/커밋 컨벤션은 [`docs/`](docs/)를 참고하세요.

---

## 📄 라이선스 (License)

This project is licensed under the **GNU GPLv3** — see the [LICENSE](LICENSE) file for details.
