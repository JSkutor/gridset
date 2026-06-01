# 📝 프로젝트 관리 및 아이디어 메모

> [!NOTE]
> 이 파일에 기록된 내용들은 **현재 구현된 진행 상황과는 무관한, 개발자 본인의 생각과 향후 개선 아이디어를 자유롭게 정리한 내용**입니다.

TODO: 추후 단축키 지원 및 시스템 통합(OS 밀착형 기능)을 위해 **Tauri**를 사용하여 데스크톱 앱으로 패키징/감싸는 방식 도입 검토.

TOFIX:

---

TODO: typescript 점진적 도입

- **현재 상태 (2026-06-01)**:
  - `tsconfig.json`은 `allowJs: true`, `checkJs: false`, `strict: true` 상태.
  - `data`, `utils`, `constants`, `types`, 주요 `hooks` 일부는 TS 전환 완료.
  - 남은 JS/JSX 축은 `store`, `api`, `components`, 테스트 파일.

- **다음 작업 순서 제안**:
  1. `src/api/supabaseWorkoutRepository.js` → `.ts`
     - Reasoning: **high**
     - 이유: Supabase row shape, 앱 내부 entity shape, 원격 동기화 오류 처리가 만나는 경계. 여기 타입이 잡히면 store slice 전환의 기준점이 생김.
     - 검증: `npm run typecheck`, `npm run test -- src/store/useWorkoutStore.supabase.test.js`

  2. `src/store/useWorkoutStore.js`와 `src/store/slices/*.js` 타입 설계
     - Reasoning: **high**
     - 이유: Graphify 기준 최상위 중심 노드이고, 대부분의 화면/훅이 의존. 먼저 `WorkoutStoreState`, `WorkoutStoreActions`, slice creator 타입을 정리한 뒤 파일별로 전환.
     - 권장 순서: `authSlice` → `exerciseSlice` → `routineSlice` → `workoutLogSlice` → `useWorkoutStore`
     - 검증: `npm run test -- src/store`, `npm run typecheck`

  3. `src/store/workoutPersistenceMigration.js` → `.ts`
     - Reasoning: **high**
     - 이유: persisted local state migration은 런타임 데이터 호환성이 걸려 있음. `unknown` 입력을 좁히는 방식으로 안전하게 전환.
     - 검증: store 전체 테스트와 기존 hydration/persistence 경로 확인.

  4. 남은 routine hooks 전환
     - 대상: `useRoutineDetailActions.js`, `useRoutineKeyboardNavigation.js`
     - Reasoning: **medium-high**
     - 이유: UI 이벤트 핸들러지만 store 액션, refs, routine/session/exercise shape를 넓게 사용. store 타입이 잡힌 뒤 진행하면 타입 중복을 줄일 수 있음.
     - 검증: `npm run test -- src/hooks/useRoutineKeyboardNavigation.test.jsx src/components/RoutineDetail.test.jsx`

  5. leaf component부터 `.tsx` 전환
     - 우선 후보: `SyncStatusBanner`, `RestTimer`, `Navigation`, `DemoClearAction`, `HelpModal`, `ExerciseAutocomplete`
     - Reasoning: **medium**
     - 이유: props와 DOM 이벤트 중심이라 전환 단위가 작고 회귀 위험이 낮음. 공통 타입을 import해 컴포넌트 props를 안정화.
     - 검증: 관련 컴포넌트 테스트와 `npm run typecheck`

  6. log 화면 컴포넌트 묶음 전환
     - 대상: `components/log/*`, `LogPage.jsx`, `ExerciseInfo.jsx`, `ExercisePastLogs.jsx`
     - Reasoning: **medium-high**
     - 이유: 이미 `logSummaries.ts`, `logFormatters.ts`, `exerciseHistory.ts`가 TS라 연결 타입 효과가 큼. 차트/날짜/집계 props가 많아 한 묶음으로 보되 leaf부터 진행.
     - 검증: log 관련 utility 테스트, 화면 smoke 확인.

  7. 큰 컨테이너 컴포넌트 전환
     - 대상: `WorkoutGrid.jsx`, `RoutineDetail.jsx`, `WorkoutCompletionModal.jsx`, `App.jsx`, `main.jsx`
     - Reasoning: **high**
     - 이유: forwardRef/useImperativeHandle, store selector, session/routine action wiring이 많아 타입 여파가 큼. 하위 hooks/store 타입 정리 후 마지막에 진행.
     - 검증: 전체 `npm run test`, `npm run build`

  8. 테스트 파일 TS/TSX 전환
     - Reasoning: **medium**
     - 이유: production 타입 안정화 뒤 mock 타입을 맞추면 편함. `*.test.jsx`는 컴포넌트 전환과 같이 `*.test.tsx`로 이동.
     - 검증: `npm run test`

  9. TypeScript strictness 강화
     - Reasoning: **high**
     - 순서: `checkJs: true` 임시 적용으로 남은 JS 경고 점검 → 남은 production JS 제거 → `allowJs: false` 검토.
     - 주의: 테스트/설정 파일까지 한 번에 막으면 잡음이 커지므로 production src를 먼저 닫기.

TODO: 1.0 완성 시 GitHub Flow 브랜치 관리 전략 도입

- **GitHub Flow 브랜치 규칙**:
  - `main` 브랜치는 언제나 배포 가능한 안정 상태를 유지하고 직접 Push 금지 (PR을 통해서만 머지).
  - 기능 개발/버그 수정은 항상 `feature/` 또는 `bugfix/` 접두사를 붙인 개별 브랜치에서 작업 후 `main`으로 PR 요청.
- **버전 태깅(Git Tag) 방식**:
  - `main` 브랜치의 모든 커밋에 매번 버전이 붙는 것은 아닙니다!
  - `main` 브랜치에서 실제로 기능이 묶여서 **배포가 나가는 커밋(배포 시점)**에만 `v1.0.0`, `v1.0.1`, `v1.1.0` 같이 Git Tag를 붙여서 이정표를 남깁니다.
  - 이를 통해 전체 커밋 히스토리 중 중요 배포 시점을 쉽고 직관적으로 찾아갈 수 있습니다.

TODO: en/ko 사이트 분기, 번역, SEO.

---
