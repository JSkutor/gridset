# ⚡ GridSet

> **MacBook 및 노트북 환경에 최적화된, 마우스가 필요 없는 데스크톱 전용 스프레드시트형 운동 일지 웹 앱**  
> *A desktop-first, keyboard-friendly workout logging web app optimized for MacBook.*

[![React 19](https://img.shields.io/badge/React-19.x-blue.svg?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5.x-brown.svg)](https://github.com/pmndrs/zustand)
[![Supabase](https://img.shields.io/badge/Supabase-Database--Auth-green.svg?logo=supabase&logoColor=white)](https://supabase.com)
[![Vitest](https://img.shields.io/badge/Vitest-3.x-yellow.svg?logo=vitest&logoColor=white)](https://vitest.dev)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

---

## 🌟 GridSet 소개

GridSet은 기존의 모바일 중심 피트니스 앱들이 충족하지 못했던 **"데스크톱 환경에서의 극강의 입력 속도"**와 **"키보드 조작감"**을 위해 탄생한 운동 일지 애플리케이션입니다. 운동을 마친 후 혹은 운동 중 헬스장에서 노트북을 펼쳐 스프레드시트에 기입하듯 빠르고 정확하게 모든 운동 기록을 입력하고 체계적으로 관리할 수 있습니다.

### 🎯 핵심 설계 철학
1. **마우스가 필요 없는 워크플로우 (Keyboard-Driven)**: 키보드 단축키와 방향키, Tab/Enter만으로 운동 루틴 설계, 실제 세트 기록 기입, 휴식 타이머 제어, 기록 완료 및 저장까지 모든 흐름을 매끄럽게 제어할 수 있습니다.
2. **프리미엄 네이티브 유틸리티 감성 (Rich Aesthetics)**: 깊고 몰입도 높은 Dark 모드 테마, 글래스모피즘(Glassmorphism) 기반 반투명 패널, 디테일한 그라데이션 및 반응형 마이크로 인터랙션을 설계하여 최상의 데스크톱 사용자 경험을 선사합니다.
3. **오프라인 퍼스트 & 완벽한 동기화 (Offline-First)**: 로그인 없이 실행하는 **"로컬 게스트 모드"**를 완벽하게 지원(브라우저 `localStorage` 기반 백업)하며, 추후 계정을 연동하면 로컬 기록 전체가 Supabase DB로 오차 없이 원격 병합(Bulk Migration) 및 실시간 동기화됩니다.

---

## ✨ 주요 기능 및 특징

### 📋 1. 스프레드시트 세트 그리드 (`S` Set 탭)
* **Excel 감각의 그리드 키보드 내비게이션**: 마우스 클릭 없이 방향키로 셀을 종횡무진하고 `Enter` 키로 다음 세트 입력 행으로 이동합니다.
* **편측성 운동(Unilateral) 네이티브 지원**: 편측 운동 활성화 시 세트별 방향(왼쪽 `L`, 오른쪽 `R`, 양쪽 `both`)이 정교하게 렌더링되며 독립적으로 기록을 수집합니다.
* **자동 휴식 타이머 (Rest Timer)**: 세트 기록 입력을 완료하면 실시간으로 오버레이 휴식 타이머가 활성화되며, 다음 세트 전까지의 잔여 시간을 고급스러운 아날로그 게이지 형태로 추적합니다.
* **실시간 세트 메모 및 히스토리 패널**: 현재 탭하고 있는 세트에 세부 메모를 즉석 입력할 수 있으며, 하단 히스토리 패널에서 지난 세션에서 적었던 메모와 세트당 볼륨 기록을 날짜별 최신순으로 깔끔하게 조회합니다.

### ⚙️ 2. 루틴 및 세션 플래너 (`R` Routine 탭)
* **주간 운동 템플릿 설계**: 요일별 세션(`Day A`, `Day B` 등)을 커스텀 정의하고 운동 종목을 할당합니다.
* **키보드 중심의 템플릿 순서 정렬**: 드래그 앤 드롭 대신 `Cmd/Ctrl + Arrow Up/Down` 조작만으로 세션 순서와 세션 내부 운동 순서를 즉각적이고 영구적으로 재배치합니다.
* **목표 가이드라인 설정**: 세션 내부 운동마다 목표 세트 수, 타겟 횟수(Reps) 또는 시간(Sec), 세트 간 휴식 시간, 운동 간 휴식 시간을 개별 제어할 수 있는 측면 패널이 동적으로 작동합니다.
* **루틴 복제 (Duplicate)**: 공들여 설계한 기존 루틴의 모든 하위 세션과 운동 세팅을 원클릭으로 완벽하게 복사하여 새로운 변형 루틴을 손쉽게 구성합니다.

### 🗺️ 3. 초성 한글 매칭 운동 검색 엔진
* **초성 및 부분 Hangul 디컴파일 검색**: 자음만 입력해도(`ㅂㅊ` → 벤치프레스, `ㄷㄷ` → 데드리프트) 한글 글자 분해 엔진을 통해 가장 연관도 높은 종목이 고속으로 자동 완성됩니다.
* **풍부한 사전 탑재**: 320여 가지가 넘는 표준 프리셋 운동 사전(`src/data/exerciseDictionary.js`)이 장비, 주동근, 보조근 정보를 내장하여 사전 탑재되어 있습니다.
* **커스텀 운동 추가**: 사전에 없는 독창적인 운동은 주동근, 도구, 편측 여부, 기록 단위를 지정하여 유저 커스텀 운동으로 손쉽게 확장하여 데이터베이스에 연동할 수 있습니다.

### 📊 4. 대시보드 및 다차원 로그 분석 (`L` Log 탭)
* **Github 스타일 70일 활성도 히트맵**: 최근 70일간 운동을 완료하고 기록한 빈도와 볼륨을 기여도 잔디 디자인의 시각적 활성도 맵으로 한눈에 파악합니다.
* **피크 퍼포먼스 전환 차트**: 운동 종목별 Peak Weight 및 볼륨 추이를 유려하게 변화하는 캔버스 차트로 렌더링하여 정체기를 돌파하도록 돕습니다.
* **다차원 분석 뷰**: 날짜별 전체 로그 보기(Daily), 특정 종목 집중 탐색(Exercise), 루틴 템플릿별 누적 추이(Routine)의 3가지 전용 사이드바를 통해 데이터를 직관적으로 쪼개어 볼 수 있습니다.

---

## ⌨️ 키보드 단축키 (Shortcut Reference)

기본 포커스를 잃었거나 어떤 인풋 영역에 갇혔다면 `Escape`를 눌러 일반 조작 모드로 복귀한 뒤 아래 단축키를 활용하세요!

### 1. 글로벌 네비게이션 및 핵심 전환
| 단축키 | 기능 |
| :--- | :--- |
| `Q` | **Routine (`R`) 탭**으로 화면 전환 |
| `W` | **Set (`S`) 탭**으로 화면 전환 *(기본 탭)* |
| `E` | **Log (`L`) 탭**으로 화면 전환 |
| `Cmd` / `Ctrl` + `←` / `→` | 탭 리스트 순서대로 이전/다음 탭 순차 순환 |
| `` ` `` (Backtick) | **[포커스 토글]** 그리드 셀 ↔ 세트별 노트 입력창 즉시 왕복 포커스 (Set 탭) / 세션 운동 첫 행으로 포커스 진입 (Routine 탭) |
| `Escape` | 현재 포커스된 입력창을 즉시 해제(Blur)하여 다시 단일키 단축키 모드로 복귀 |

### 2. 스프레드시트 인풋 그리드 (`S` Set 탭)
| 단축키 | 기능 |
| :--- | :--- |
| `Arrow Up / Down` | 동일 열의 위/아래 입력 셀로 포커스 이동 |
| `Enter` | 기록 값을 반영하고 아래 행 셀로 수직 이동 |
| `Tab` | 오른쪽 인접 열 셀로 이동 (행 끝에 도달하면 다음 행 첫 번째 열로 이동) |
| `Shift + Tab` | 왼쪽 인접 열 셀로 역방향 이동 |
| `Arrow Left / Right` | 입력 인풋 커서가 맨 앞/맨 뒤 끝에 위치했을 때 좌/우 열 셀로 이동 |
| **마지막 행 끝 셀에서 Tab** | **[자동 세트 추가]** 빈 입력 행을 자동으로 즉시 생성하고 포커스를 새 행의 첫 열로 자동 포지셔닝 |

### 3. 루틴 구성기 (`R` Routine 탭)
| 단축키 | 기능 |
| :--- | :--- |
| `Arrow Up / Down` | 좌측 세션 목록 혹은 중앙 세션별 지정 운동 리스트 수직 탐색 |
| `Cmd` / `Ctrl` + `↑` / `↓` | **[실시간 재정렬]** 포커스된 세션의 순서 또는 운동 종목의 우선 순위 순서를 즉각 맞바꾸고 저장 |
| `Arrow Right` | 특정 운동 포커스 상태에서 우측 세부 설정 패널(세트수/목표횟수/휴식시간 제어 인풋)로 포커스 진입 |
| `Arrow Left` | 세부 설정 인풋에서 포커스를 빼내어 다시 좌측 운동 목록 행으로 복귀 |
| `Enter` / `Space` | 세션 또는 운동 아이템 선택 상태 토글 |

---

## 🛠️ 기술 스택 (Tech Stack)

* **프레임워크**: React 19 (Functional Components, Custom Hooks)
* **빌더 및 번들러**: Vite 8 (Hot Module Replacement 완벽 지원)
* **상태 관리 & 지속성**: Zustand 5 + `persist` 미들웨어를 통한 로컬 오프라인 데이터 자동 백업
* **서버리스 백엔드**: Supabase Database & Auth (PostgreSQL DB, Row Level Security 인가 제어)
* **스타일 아키텍처**: Vanilla CSS (CSS Variables 토큰 기반 디자인 시스템, 블러 및 모션 최적화)
* **테스트 프레임워크**: Vitest + React Testing Library + JSDOM 환경

---

## 📂 프로젝트 폴더 구조 (Folder Structure)

```text
gridset/
├── .cursorrules               # 개발 에이전트를 위한 규칙 사전
├── scratch/                   # 데이터베이스 생성 SQL, 가이드 유틸 모음
│   ├── supabase_schema.sql             # Supabase 전체 테이블 DDL 및 RLS 정책 스크립트
│   ├── supabase_seed_default_exercises.sql  # 320개 한/영 고품질 기본 운동 Seed 파일
│   └── supabase_fix_grants.sql         # 스키마 권한 오류 복구용 패치 SQL
├── src/
│   ├── components/            # UI 리액트 컴포넌트 폴더
│   │   ├── routine/           # Routine 탭 서브 모듈 컴포넌트
│   │   ├── log/               # Log 탭 서브 모듈 컴포넌트
│   │   └── RestTimer.jsx      # 세트 완료 시 트리거되는 오버레이 타이머
│   ├── hooks/                 # 재사용 가능한 마이크로 훅 & 단축키 핸들러
│   │   ├── useGridNavigation.js        # 스프레드시트형 Excel 포커스 이동 엔진
│   │   ├── useRoutineKeyboardNavigation.js # 루틴 템플릿 키보드 순서 교환 엔진
│   │   └── useGlobalShortcuts.js       # ESC, 백틱, 탭 전환 등 앱 통합 리스너
│   ├── store/                 # 중앙 상태 관리 및 DB 싱크 스토어
│   │   └── useWorkoutStore.js          # Zustand 상태 로직 및 Supabase 비동기 API 연동부
│   ├── utils/                 # 고성능 인프라 유틸리티 함수
│   │   ├── hangul.js                   # 초성 및 한글 부분 일치 검색 컴파일러
│   │   ├── exerciseSearch.js           # 고품질 점수 기반 운동 랭킹 및 검색기
│   │   └── setGridModel.js             # 세트 그리드 렌더링에 필요한 납작한 2D 맵 모델 가공
│   ├── index.css              # 커스텀 테마 변수 및 글래스모피즘 전역 스타일링
│   ├── App.jsx                # 전역 레이아웃 및 뷰 바인딩 라우팅의 코어
│   └── main.jsx               # React 19 앱 시작점
├── eslint.config.js           # 코드 정적 분석 린트 환경 설정
├── vite.config.js             # Vite 번들링 세부 커스텀 구성
└── package.json               # 프로젝트 의존성 라이브러리 목록 명세
```

---

## 🚀 로컬 개발 셋업 (Getting Started)

### 1. 소스 클론 및 의존성 다운로드
```bash
git clone https://github.com/your-username/gridset.git
cd gridset
npm install
```

### 2. 환경 변수 설정
프로젝트 루트 경로에 `.env.local` 파일을 만들고 본인의 Supabase 자격 증명을 작성합니다.
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
> [!NOTE]
> 만약 `.env.local` 파일이 존재하지 않거나 플레이스홀더 값이 적혀있을 경우, 브라우저 콘솔에 안전 경고 메시지가 표시되며 **"Local Guest Mode (로컬 오프라인 전용 게스트 모드)"**로 자동 대체 구동되므로 부담 없이 모든 로컬 기능을 테스트해 볼 수 있습니다.

### 3. 로컬 서버 구동
```bash
# 로컬 개발 서버 실행 (기본 포트: 5173)
npm run dev
```

### 4. 테스트 슈트 실행
GridSet은 핵심 한글 검색, 순서 Compaction 알고리즘, 세트 그리드 가공 로직에 대한 높은 테스트 코버리지를 고수하고 있습니다.
```bash
# 전체 단위/통합 테스트 자동 실행
npm run test
```

---

## 💾 Supabase 백엔드 데이터베이스 구축 가이드

원격 데이터 싱크 및 유저 인증 기능을 가동하기 위해 본인만의 Supabase 인스턴스를 즉시 셋업할 수 있습니다.

1. [Supabase](https://supabase.com)에 로그인하고 신규 프로젝트를 생성합니다.
2. 사이드바 메뉴에서 **SQL Editor**로 이동하여 **New Query**를 생성합니다.
3. [scratch/supabase_schema.sql](file:///Users/kutor/Documents/Projects_Kutor/gridset/scratch/supabase_schema.sql) 파일의 내용을 복사하여 쿼리창에 붙여 넣고 실행합니다.
   * `routines`, `sessions`, `session_exercises`, `exercises`, `workout_logs`, `set_records` 테이블과 외래키 연쇄 삭제(Cascade) 제약, UUID 자동 생성이 한 번에 구성됩니다.
   * 데이터 보안을 위해 소유자만 쓰기 권한이 부여되는 **Row Level Security (RLS)** 제어 정책이 테이블마다 정확히 활성화됩니다.
4. 이어서 [scratch/supabase_seed_default_exercises.sql](file:///Users/kutor/Documents/Projects_Kutor/gridset/scratch/supabase_seed_default_exercises.sql)의 내용을 복사하여 실행합니다.
   * 320여 개 이상의 기본 제공 한글/영어 운동 사전 데이터가 대규모 벌크 인서트(Bulk Insert)됩니다.
5. 설정이 완료되면 발급된 API 주소와 Anon 키를 로컬 `.env.local` 파일에 기재하고 서비스를 시작하면 자동 원격 싱크와 회원가입/로그인 흐름이 즉시 활성화됩니다!

---

## 🤝 기여 가이드 (Contributing)

GridSet은 오픈소스 생태계에서의 적극적인 피드백과 Pull Request(PR)를 진심으로 환영합니다! 프로젝트에 기여하고 싶으시다면 아래의 컨벤션을 준수하여 참여해 주시면 감사하겠습니다.

### 1. 이슈 제보 및 제안
* 버그 발견, 단축키 개선 사항, 추가를 원하는 핵심 편의 기능이 있다면 편하게 **GitHub Issue**를 발부해 주세요.

### 2. 개발 및 브랜치 전략
* 메인 브랜치는 `main` 입니다.
* 새로운 작업은 항상 최신 `main`에서 브랜치를 분기하여 작업합니다.
  * 기능 추가: `feature/개발기능명` (예: `feature/exercise-substitution`)
  * 오류 수정: `bugfix/해결버그명` (예: `bugfix/timer-safari-glitch`)

### 3. 테스트 및 품질 유지
* GridSet은 안전한 기능 병합을 위해 테스트 작성을 매우 중시합니다. 새로운 데이터 가공 유틸이나 로직 변경이 생길 경우, 대응하는 테스트 케이스(`.test.js` 또는 `.test.jsx`)를 반드시 작성해 주시기 바랍니다.
* 코드 제출 전에 `npm run test`를 통과하는지 확인하시고, 정적 분석을 위해 `npm run lint`로 린트 경고가 없는지 검증해 주세요.

### 4. Pull Request 제출
* PR 제목은 작업한 내용을 요약하여 작성하고, 설명 본문에는 관련 Issue 번호 및 핵심 변경 내용의 요약을 기술해 주세요.
* 리뷰어가 변경된 UI 구동 화면을 한눈에 검토할 수 있도록 동작 화면 캡처 이미지나 녹화 영상(GIF 등)을 PR 본문에 첨부해 주시면 신속한 검토와 병합에 큰 도움이 됩니다.

---

## 📄 라이선스 (License)

This project is licensed under the **GNU AGPLv3** - see the [LICENSE](LICENSE) file for details.

GridSet을 이용해 주셔서 감사합니다! 더 빠르고 강도 높은 훈련을 편리하게 기록해 보세요. 💪
