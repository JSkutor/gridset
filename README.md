# ⚡ GridSet

> **MacBook 및 노트북 환경에 최적화된, 마우스가 필요 없는 데스크톱 전용 스프레드시트형 운동 일지 웹 앱**  
> *A desktop-first, keyboard-friendly workout logging web app optimized for MacBook.*

[![React 19](https://img.shields.io/badge/React-19.x-blue.svg?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5.x-brown.svg)](https://github.com/pmndrs/zustand)
[![Supabase](https://img.shields.io/badge/Supabase-Database--Auth-green.svg?logo=supabase&logoColor=white)](https://supabase.com)
[![Vitest](https://img.shields.io/badge/Vitest-3.x-yellow.svg?logo=vitest&logoColor=white)](https://vitest.dev)
[![License: GPL v3](https://img.shields.io/badge/License-GPL_v3-blue.svg)](LICENSE)

---

## 🌟 GridSet 소개

GridSet은 기존의 모바일 중심 피트니스 앱들이 충족하지 못했던 **"데스크톱 환경에서의 극강의 입력 속도"**와 **"키보드 조작감"**을 위해 탄생한 운동 일지 애플리케이션입니다. 운동을 마친 후 혹은 운동 중 헬스장에서 노트북을 펼쳐 스프레드시트에 기입하듯 빠르고 정확하게 모든 운동 기록을 입력하고 체계적으로 관리할 수 있습니다.

### 🎯 핵심 설계 철학
1. **마우스가 필요 없는 워크플로우 (Keyboard-Driven)**: 키보드 단축키와 방향키, Tab/Enter만으로 운동 루틴 설계, 실제 세트 기록 기입, 휴식 타이머 제어, 기록 완료 및 저장까지 모든 흐름을 매끄럽게 제어할 수 있습니다.
2. **프리미엄 네이티브 유틸리티 감성 (Rich Aesthetics)**: 깊고 몰입도 높은 Dark 모드 테마, 글래스모피즘(Glassmorphism) 기반 반투명 패널, 디테일한 그라데이션 및 반응형 마이크로 인터랙션을 설계하여 최상의 데스크톱 사용자 경험을 선사합니다.
3. **오프라인 퍼스트 & 안전한 동기화 (Offline-First)**: 로그인 없이 실행하는 **"로컬 게스트 모드"**를 지원(브라우저 `localStorage` 기반 백업)하며, 계정을 연동하면 Supabase 서버 기록을 기준으로 안전하게 동기화합니다. 게스트 기록 업로드는 서버가 비어 있고 데모 데이터를 삭제한 뒤 만든 기록일 때만 허용됩니다.

---

## ✨ 주요 기능 및 특징

### 📋 1. 스프레드시트 세트 그리드 (Set 페이지)
* **Excel 감각의 그리드 키보드 내비게이션**: 마우스 클릭 없이 방향키로 셀을 이동하고 `Enter` 키로 다음 세트 입력 행으로 이동합니다.
* **편측성 운동(Unilateral) 네이티브 지원**: 편측 운동 활성화 시 세트별 방향(왼쪽 `L`, 오른쪽 `R`, 양쪽 `both`)이 정교하게 렌더링되며 독립적으로 기록을 수집합니다.
* **자동 휴식 타이머 (Rest Timer)**: 세트 기록 입력을 완료하면 실시간으로 오버레이 휴식 타이머가 활성화되며, 다음 세트 전까지의 잔여 시간을 아날로그 게이지 형태로 추적합니다.
* **실시간 세트 메모 및 히스토리 패널**: 현재 탭하고 있는 세트에 세부 메모를 즉석 입력할 수 있으며, 하단 히스토리 패널에서 지난 세션의 메모와 세트당 볼륨 기록을 날짜별 최신순으로 조회합니다.
* **운동 완료 모달**: 세션 기록을 마치면 완료 요약 모달로 당일 수행 내역을 확인할 수 있습니다.

### ⚙️ 2. 루틴 및 세션 플래너 (Routine 페이지)
* **주간 운동 템플릿 설계**: 요일별 세션(`Day A`, `Day B` 등)을 커스텀 정의하고 운동 종목을 할당합니다.
* **키보드 중심의 템플릿 순서 정렬**: 드래그 앤 드롭 대신 `Cmd/Ctrl + Arrow Up/Down` 조작만으로 세션 순서와 세션 내부 운동 순서를 즉각적이고 영구적으로 재배치합니다.
* **목표 가이드라인 설정**: 세션 내부 운동마다 목표 세트 수, 타겟 횟수(Reps) 또는 시간(Sec), 세트 간 휴식 시간, 운동 간 휴식 시간을 개별 제어할 수 있는 측면 패널이 동적으로 작동합니다.
* **운동 그룹 (Superset/Circuit)**: 세션당 최대 4개까지 운동 그룹을 묶어 연속 수행 흐름을 시각적으로 표현하고, 그룹 단위로 목표 세트·휴식 시간을 공유합니다.
* **루틴 복제 (Duplicate)**: 기존 루틴의 모든 하위 세션과 운동 세팅을 원클릭으로 복사하여 새로운 변형 루틴을 손쉽게 구성합니다.

### 🗺️ 3. 초성 한글 매칭 운동 검색 엔진
* **초성 및 부분 Hangul 디컴파일 검색**: 자음만 입력해도(`ㅂㅊ` → 벤치프레스, `ㄷㄷ` → 데드리프트) 한글 글자 분해 엔진을 통해 가장 연관도 높은 종목이 고속으로 자동 완성됩니다.
* **풍부한 사전 탑재**: **875종**의 표준 프리셋 운동 카탈로그(`scratch/extracted_exercises.json` → `src/data/exerciseDictionary.js`)가 장비, 주동근, 보조근 정보를 내장하여 제공됩니다.
* **커스텀 운동 추가**: 사전에 없는 운동은 주동근, 도구, 편측 여부, 기록 단위를 지정하여 유저 커스텀 운동으로 확장하고, 로그인 시 Supabase에 연동할 수 있습니다.

### 📊 4. 대시보드 및 다차원 로그 분석 (Log 페이지)
* **Github 스타일 70일 활성도 히트맵**: 최근 70일간 운동을 완료하고 기록한 빈도와 볼륨을 기여도 잔디 디자인의 시각적 활성도 맵으로 한눈에 파악합니다.
* **피크 퍼포먼스 전환 차트**: 운동 종목별 Peak Weight 및 볼륨 추이를 캔버스 차트로 렌더링하여 정체기를 돌파하도록 돕습니다.
* **다차원 분석 뷰**: 날짜별 전체 로그 보기(Daily), 특정 종목 집중 탐색(Exercise), 루틴 템플릿별 누적 추이(Routine)의 3가지 전용 사이드바를 통해 데이터를 직관적으로 쪼개어 볼 수 있습니다.

### 🔐 5. 계정 및 동기화
* **게스트 / 로그인 이중 모드**: Supabase 환경 변수 없이도 로컬에서 전 기능을 사용할 수 있으며, 계정 연동 후 서버 데이터를 기준으로 동기화합니다. 자세한 정책은 [docs/SYNC_POLICY.md](docs/SYNC_POLICY.md)를 참고하세요.
* **동기화 상태 배너**: 원격 동기화 진행·오류 상태를 화면 상단 배너로 표시합니다.
* **도움말 및 데이터 관리**: 우측 하단 도움말 버튼에서 단축키 안내, 데모 데이터 생성, 전체 데이터 초기화를 수행할 수 있습니다.

---

## ⌨️ 키보드 단축키 (Shortcut Reference)

기본 포커스를 잃었거나 어떤 인풋 영역에 갇혔다면 `Escape`를 눌러 일반 조작 모드로 복귀한 뒤 아래 단축키를 활용하세요. 한국어 키보드에서는 `` ` `` 대신 `₩` 키로 동일하게 동작합니다.

> 상세 명세는 [docs/KEYBOARD_UX.md](docs/KEYBOARD_UX.md)를 참고하세요.

### 1. 글로벌 네비게이션 및 핵심 전환
| 단축키 | 기능 |
| :--- | :--- |
| `Q` | **Routine** 페이지로 화면 전환 |
| `W` | **Set** 페이지로 화면 전환 *(기본)* |
| `E` | **Log** 페이지로 화면 전환 |
| `` ` `` / `₩` | **[포커스 토글]** Set: 그리드 셀 ↔ 세트별 노트 / Routine: 세션 운동 첫 행으로 포커스 진입 |
| `Escape` | 현재 포커스된 입력창을 즉시 해제(Blur)하여 다시 단일키 단축키 모드로 복귀 |

> `1` / `2` / `3` 숫자 탭 단축키는 더 이상 사용하지 않으며, 의도치 않은 동작을 막기 위해 전역에서 차단됩니다.

### 2. 스프레드시트 인풋 그리드 (Set 페이지)
| 단축키 | 기능 |
| :--- | :--- |
| `Arrow Up / Down` | 동일 열의 위/아래 입력 셀로 포커스 이동 |
| `Enter` | 기록 값을 반영하고 아래 행 셀로 수직 이동 |
| `Tab` | 오른쪽 인접 열 셀로 이동 (행 끝에 도달하면 다음 행 첫 번째 열로 이동) |
| `Shift + Tab` | 왼쪽 인접 열 셀로 역방향 이동 |
| `Arrow Left / Right` | 입력 인풋 커서가 맨 앞/맨 뒤 끝에 위치했을 때 좌/우 열 셀로 이동 |

### 3. 루틴 구성기 (Routine 페이지)
| 단축키 | 기능 |
| :--- | :--- |
| `Arrow Up / Down` | 좌측 세션 목록 혹은 중앙 세션별 지정 운동 리스트 수직 탐색 |
| `Cmd` / `Ctrl` + `↑` / `↓` | 포커스된 세션·운동 순서 변경, 또는 설정 패널 수치 조절 |
| `Arrow Right` | 운동 포커스 상태에서 우측 세부 설정 패널로 포커스 진입 |
| `Arrow Left` | 세부 설정 인풋에서 좌측 운동 목록 행으로 복귀 |
| `Enter` / `Space` | 세션 또는 운동 아이템 선택 상태 토글 |

### 4. 로그 분석 (Log 페이지 활성 시)
| 단축키 | 기능 |
| :--- | :--- |
| `A` | **일일 로그 (Daily)** 뷰 |
| `S` | **운동별 추이 (Exercise)** 뷰 |
| `D` | **루틴 로그 (Routine)** 뷰 |

---

## 🛠️ 기술 스택 (Tech Stack)

* **프레임워크**: React 19 (Functional Components, Custom Hooks)
* **빌더 및 번들러**: Vite 8 (HMR)
* **상태 관리 & 지속성**: Zustand 5 + `persist` 미들웨어 (슬라이스: `auth`, `exercise`, `routine`, `workoutLog`)
* **서버리스 백엔드**: Supabase Database & Auth (PostgreSQL, Row Level Security)
* **UI·모션**: Lucide React 아이콘, Framer Motion, `@formkit/auto-animate`
* **스타일**: Vanilla CSS (CSS Variables 토큰, 글래스모피즘)
* **테스트**: Vitest + React Testing Library + JSDOM (단위/통합), Playwright (E2E)

---

## 📂 프로젝트 폴더 구조 (Folder Structure)

```text
gridset/
├── docs/                      # 개발 표준 및 기술 문서
│   ├── KEYBOARD_UX.md         # 키보드 UX 전체 명세
│   ├── SCHEMA.md              # DB 스키마 정의
│   ├── REQUIREMENTS.md        # 요구사항 및 로드맵
│   └── git_*.md               # Git 브랜치·커밋 컨벤션
├── scratch/                   # DB DDL, 운동 마스터 JSON, Seed·유틸 스크립트
│   ├── extracted_exercises.json       # 875종 운동 카탈로그 (런타임 소스)
│   ├── supabase_schema.sql            # 테이블·RLS DDL
│   └── supabase_seed_default_exercises.sql
├── tests/                     # Playwright E2E (`navigation.spec.js` 등)
├── src/
│   ├── api/                   # Supabase 리포지토리 (`supabaseWorkoutRepository.js`)
│   ├── components/            # UI 컴포넌트
│   │   ├── routine/           # Routine 탭 (세션·운동·그룹 편집)
│   │   ├── log/               # Log 탭 (히트맵·차트·타임라인)
│   │   ├── WorkoutGrid.jsx    # Set 탭 스프레드시트 그리드
│   │   ├── AuthModal.jsx      # 로그인·회원가입
│   │   ├── AccountMenu.jsx    # 계정·동기화 메뉴
│   │   └── HelpModal.jsx      # 단축키·데이터 관리
│   ├── hooks/                 # 키보드·탭·인증·세션 로테이션 훅
│   ├── store/
│   │   ├── slices/            # Zustand 슬라이스 (auth, exercise, routine, workoutLog)
│   │   └── useWorkoutStore.js
│   ├── utils/                 # hangul, exerciseSearch, setGridModel 등
│   └── data/
│       └── exerciseDictionary.js   # extracted_exercises.json 래퍼
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

### 2. 환경 변수 설정
프로젝트 루트에 `.env.local` 파일을 만들고 Supabase 자격 증명을 작성합니다.
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
> [!NOTE]
> `.env.local`이 없거나 플레이스홀더 값이면 브라우저 콘솔에 안내가 표시되며 **로컬 게스트 모드**로 동작합니다. 로그인·원격 동기화 없이도 로컬 기능 전체를 테스트할 수 있습니다.

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

# ESLint
npm run lint
```

---

## 💾 Supabase 백엔드 데이터베이스 구축 가이드

원격 데이터 싱크 및 유저 인증을 사용하려면 Supabase 프로젝트를 셋업합니다.

1. [Supabase](https://supabase.com)에서 신규 프로젝트를 생성합니다.
2. **SQL Editor**에서 **New Query**를 연 뒤 [scratch/supabase_schema.sql](scratch/supabase_schema.sql) 내용을 실행합니다.
   * `routines`, `sessions`, `session_exercises`, `session_exercise_groups`, `exercises`, `workout_logs`, `set_records` 테이블과 RLS 정책이 구성됩니다.
3. 이어서 [scratch/supabase_seed_default_exercises.sql](scratch/supabase_seed_default_exercises.sql)을 실행합니다.
   * **875종** 운동 마스터 데이터가 `exercises` 테이블에 삽입됩니다.
4. 권한 오류가 있으면 [scratch/supabase_fix_grants.sql](scratch/supabase_fix_grants.sql)을 참고합니다.
5. 발급된 API URL과 Anon 키를 `.env.local`에 기재한 뒤 `npm run dev`로 서비스를 시작하면 로그인·원격 동기화가 활성화됩니다.

---

## 🤝 기여 가이드 (Contributing)

GridSet은 오픈소스 생태계에서의 피드백과 Pull Request를 환영합니다.

### 1. 이슈 제보 및 제안
* 버그, 단축키 개선, 기능 제안은 **GitHub Issue**로 등록해 주세요.

### 2. 개발 및 브랜치 전략
* 메인 브랜치는 `main`입니다.
* 새 작업은 최신 `main`에서 브랜치를 분기합니다.
* [Git 브랜치 컨벤션](docs/git_branch_convention.md), [Git 커밋 컨벤션](docs/git_commit_convention.md)을 따릅니다.

### 3. 테스트 및 품질 유지
* 데이터 가공·스토어 로직 변경 시 대응하는 `.test.js` / `.test.jsx`를 추가해 주세요.
* 제출 전 `npm run test`와 `npm run lint` 통과를 확인해 주세요.

### 4. Pull Request 제출
* PR 제목·본문에 변경 요약과 관련 Issue 번호를 기재하고, UI 변경 시 스크린샷·GIF를 첨부하면 검토에 도움이 됩니다.

---

## 📄 라이선스 (License)

This project is licensed under the **GNU GPLv3** — see the [LICENSE](LICENSE) file for details.

GridSet을 이용해 주셔서 감사합니다! 더 빠르고 강도 높은 훈련을 편리하게 기록해 보세요. 💪
