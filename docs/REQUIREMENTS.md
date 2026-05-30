# GridSet Requirements

## 1. Product Vision
GridSet is a desktop-first workout logging web app for MacBook users who want a fast, keyboard-friendly routine and set-entry workflow. The app should feel closer to a focused native macOS utility than a generic fitness dashboard: dark, compact, responsive, and satisfying to use repeatedly.

## 2. Current Product Scope
- **Target platform**: desktop web, optimized for MacBook-sized screens and window resolutions.
- **Current mode**: local guest mode plus optional Supabase Auth account sync. See [SYNC_POLICY.md](SYNC_POLICY.md) for the guest-to-user data rules.
- **Current persistence**: Zustand Persist with browser `localStorage`, with Supabase used as the remote database source for signed-in users.
- **Current data model**: local UUID-based entities that mirror the Supabase database schema.
- **Initial local experience**: new guest stores are seeded with rich demo workout data so the app opens with populated routines, logs, charts, and calendars.
- **Mobile support**: not required for the current phase (focus is fully on MacBook desktop ergonomics).
- **Future packaging**: Tauri-based macOS desktop app wrapper.

## 3. Implemented Navigation
Gridset supports high-performance tab-level and sub-tab-level keyboard shortcut navigation to eliminate mouse dependency.
- **Main Tabs**:
  - `Q` -> Routine page (`routine`) for routine and session template editing.
  - `W` -> Set page (`set`) for real-time exercise set-entry grids and timers.
  - `E` -> Log page (`log`) for historical diaries, calendars, and progress statistics.
- **Log Sub-Tabs** (accessible when Log Tab is active):
  - `A` -> Daily logs & Calendar view.
  - `S` -> Exercise-specific progress metrics and historical charts.
  - `D` -> Routine historical timeline and structure changes.
- **Focus Mechanics**:
  - `Esc` returns focus to the active tab's primary interaction container.
  - Arrow keys, `Tab`, and `Shift + Tab` shift element focus cleanly without visual hover glitches.

## 4. Implemented Routine Page
The Routine tab manages reusable workout templates and session plans.

### 4.1 Routine Management
- Create a new routine.
- Duplicate an existing routine, including sessions and session exercise targets.
- Rename a routine.
- Delete a routine and cascade-delete its sessions and session exercise links.
- Select a routine from a horizontal routine list.

### 4.2 Session Management
- Create, rename, delete, and select sessions inside a routine.
- Sessions have routine-local order and are displayed as `Day A`, `Day B`, etc.
- Each routine can also have one temporary session (`session_order = 0`) for one-off or supplemental workout composition that is excluded from regular session ordering and the seven-session cap.
- Deleting a session compacts remaining session order.
- Keyboard support:
  - Arrow keys move between sessions.
  - `Cmd`/`Ctrl` + `Arrow Up`/`Down` reorders sessions.

### 4.3 Session Exercise Management
- Add exercises to a session through autocomplete.
- Add custom exercises when no dictionary result exists.
- Prevent duplicate exercises inside the same session.
- Delete exercises from a session and compact remaining order.
- Keyboard support:
  - Arrow keys move between exercises.
  - `Cmd`/`Ctrl` + `Arrow Up`/`Down` reorders exercises.
  - `Arrow Right` moves into target record editing.
- Per-exercise template settings:
  - Target sets.
  - Target record, such as reps or seconds.
  - Rest time between sets.
  - Rest time after exercise.
  - Unilateral (편측성) setting configuration display.

## 5. Implemented Set Page
The Set tab is the core real-time workout-entry surface.

### 5.1 Session Selection
- Compact dropdown session selector in the Set Grid header.
- Defaults to the next session in rotation based on recent workout logs.

### 5.2 Exercise Information Panel
- Shows selected exercise name.
- Shows a 70-day activity heatmap based on completed set records.
- Shows a progress chart using daily peak weight for weighted exercises, or daily peak reps/seconds for bodyweight/time-based exercises.
- Shows all-time total volume/count/time depending on exercise unit.

### 5.3 Set Input Grid
- Renders one set-entry block per exercise in the selected session template.
- Supports Unilateral exercises (L/R side designation per set).
- Initial row count follows each exercise's target set count.
- Supports numeric-only weight and reps input.
- **Excel-like Keyboard Movement through Cells**:
  - `Arrow Up`/`Down` shifts focus vertically between rows.
  - `Arrow Left`/`Right` shifts focus horizontally at text cursor boundaries.
  - `Enter` moves focus downward to the same cell in the next set row.
  - `Tab`/`Shift+Tab` moves focus sequentially through cells.
- **Special Tab & Keybind Shortcuts**:
  - **First-Weight Tab Auto-Fill**: Pressing `Tab` after entering the `weight` on the **first set** of an exercise block automatically propagates/copies that weight value to all subsequent sets of that exercise block, eliminating repetitive typing.
  - **Reps Tab Rest-Timer Trigger**: Pressing `Tab` on a completed, numeric `reps` cell completes the set and immediately kicks off the **automatic rest timer** (based on that exercise's Rest Between Sets template setting).
  - **Manual Row Append**: Pressing `Tab` never appends set rows automatically. Extra sets are added only through the visible `세트 추가` button so the grid does not grow by accident during fast keyboard entry.
  - **Backquote (\`) Note Toggle**: Pressing the backquote key (`\`` or `₩`) instantly toggles keyboard focus directly between the active spreadsheet cell and the per-set memo textarea at the bottom, allowing seamless note writing.
- The manual `세트 추가` button adds another set row for an exercise.
- Per-set memo input at the bottom of the grid, updated as the user focuses on different sets.
- Includes a "Finish Workout" / "Save Session" button to write draft data to permanent history (`workoutLogs` and `setRecords`) (can be submitted by hitting `Enter` when focused on the button).

### 5.4 Past Logs Panel
- Shows completed historical set records for the selected exercise.
- Groups records by workout log date.
- Sorts past logs newest first.
- Displays each date's total volume/count/time and readonly set rows.

## 6. Implemented Log Page
The Log tab is a comprehensive dashboard of the user's completed exercises, progress analytics, and template history.

### 6.1 Daily Logs Sub-tab (`A`)
- **Interactive Calendar Grid**: Highlighted dots mark completed workout days. Users can click any calendar date to jump to that day's records.
- **Daily Summary Cards**: Displays all workouts completed on the selected date. Each card summarizes start/end time, total volume, sets completed, and session metadata.
- **Detailed Set Record List**: Renders the complete, read-only exercise-by-exercise set grid for each logged workout (including unilateral indicators, reps/weight, and personal memos).

### 6.2 Exercise-specific Insights (shortcut `S`)
- **Interactive Exercise Selector**: Quick lookup for all exercises performed in the user's history.
- **Performance Charting**: Draws daily peak records over time. Fully responsive to the selected exercise's specific unit (e.g. Peak Weight for weighted movements, Peak Reps/Seconds for bodyweight/timer movements).
- **Consolidated Metrics Cards**: Shows all-time performance highlights (All-time Max Weight, Max Reps, Total Volumes, Total Sets Completed).
- **Dynamic Calendar Highlights**: Integrates a mini calendar showing every day this specific exercise was performed.

### 6.3 Routine Timeline Sub-tab (`D`)
- **Workout Routine Composition Tracker**: Compiles the chronological history of routine templates.
- Shows when sessions or exercises were modified, added, or deleted inside templates.
- Lists full breakdown summaries of exercises, target sets, and target performance milestones planned for each session.

## 7. Implemented Help & Demo Data
Gridset includes a robust demo dataset and an always-available help/data-management modal to minimize initial adoption friction.

### 7.1 Demo Data
- First-time guest stores are initialized with the same structured demo data generator used by the manual demo-data action.
- The demo dataset populates routines, sessions, session exercises, workout logs, and set records so charts, calendars, past logs, and routine timelines are meaningful immediately.
- Users can replace their current workspace with fresh demo data from the Help modal.

### 7.2 Interactive Data Management
- Users can access the "도움말" (HelpModal) modal in the top right corner at any time.
- Displays a multi-column cheat sheet of all keyboard shortcuts for main tabs, set grids, routine editors, exercise search, and log panels.
- **Data Action Triggers**:
  - **Load Demo Data**: Replaces current data with the rich, structured demo history.
  - **Clear All Data**: Wipes everything and resets the workspace to a blank state.
- Both actions are guarded by a custom double-confirmation overlay (`help-confirm-overlay`) to prevent accidental data loss.

### 7.3 Not Currently Implemented
- There is no separate slide-based onboarding modal in the current codebase.
- There is no persisted `hasCompletedOnboarding` state in the current persistence schema.

## 8. Exercise Search & Dictionary
- Uses a local offline exercise dictionary (`exerciseDictionary.js`).
- Contains standard fitness terminology and synonyms mapping both Korean and English body-building and fitness names.
- Supports Korean name search, chosung search (`ㅂㅊ`), and partial Hangul composition matching.
- Supports English names and synonyms.
- Limits autocomplete suggestions to 8 results for visual cleanliness.
- Allows custom exercise creation with selected primary muscle, equipment, unit type, and unilateral flag.

## 9. State And Data Management
- Global app state is managed with Zustand.
- Signed-in users hydrate and sync their data through Supabase with write-through sync.
- Guest users can continue using local-only data, which is safely persisted via Zustand Persist in the browser's `localStorage` (Schema versioning is fully maintained).
- **Guest-to-User Migration**: Guest-local data is uploaded only when the server account is empty and the guest workspace was created after clearing the bundled demo data. Existing server data always wins over unknown guest-local data. See [SYNC_POLICY.md](SYNC_POLICY.md).
- **Remote Sync Failure UX**:
  - Local changes are applied immediately before remote writes run.
  - Failed background remote-write tasks are stored in an in-memory retry queue.
  - Signed-in users see a top-right sync failure banner with the failed action type, pending task count, and a retry button.
  - The retry queue is cleared when the user returns to guest mode or all queued writes succeed.
- **Persisted State Entities**:
  - `currentUser`
  - `exercises` (with `is_unilateral` field support)
  - `routines`
  - `sessions`
  - `sessionExercises`
  - `workoutLogs`
  - `setRecords` (including L/R/both side designation and set-specific memos)
  - `isSyncing`
  - `authSession`
- **Non-persisted Runtime State**:
  - `remoteSyncError` is intentionally excluded from Zustand Persist and only reflects the current runtime retry queue.
- **Sync Optimization**: Local data updates are applied immediately, and a remote write task runs in the background. Creation-style remote writes use idempotent `upsert` paths where practical to support retry after transient failures.

## 10. Testing Requirements
Current automated tests cover:
- Hangul decomposition, chosung extraction, and Hangul matching.
- Exercise autocomplete ranking and filtering.
- Session day formatting.
- Set grid model generation, flattening, insert-position calculation, and numeric input validation.
- Workout store behavior:
  - Exercise duplicate prevention.
  - Routine/session/session-exercise creation.
  - Temporary session creation and ordering rules.
  - Delete cascades.
  - Order compaction.
  - Routine duplication.
  - Workout log deletion cascading to set records.
- Supabase sync behavior:
  - Public exercise hydration.
  - Custom exercise upload for foreign-key references.
  - Public master exercise rows are not re-uploaded as user custom rows.
  - Failed remote writes expose retryable sync state and clear after successful retry.

## 11. Current Architecture Notes
- **Utility Logic Separation**: Pure utility logic (calculations, formats) lives in `src/utils/`.
- **State Store isolation**: Zustand state and local persistence live in `src/store/useWorkoutStore.js`.
- **Data Persistence Migration**: Schema migration logic is isolated in `src/store/workoutPersistenceMigration.js`.
- **Repository Pattern**: Supabase read/write repository logic is cleanly isolated in `src/api/supabaseWorkoutRepository.js`.
- **Custom Hooks for App Modularization**:
  - `useGlobalShortcuts.js` and `useTabNavigation.js` isolate global keybind listeners.
  - `useWorkoutSessionRotation.js` isolates session selection logic.
  - `useAuthSessionBridge.js` bridges Supabase auth states with Zustand.
  - `useWorkoutDraft.js` separates Set Grid input buffer mutations from persistent state.
- **Sync Failure UI**: `src/components/SyncStatusBanner.jsx` renders retryable remote-write failures for signed-in users.
- **Demo Data Generation**: Seed generation logic is isolated in `src/data/dummyGenerator.js`.

## 12. Future Requirements
- **Workout Execution**:
  - Add exercise substitution for a single workout without modifying the saved routine template.
- **Supabase Integration**:
  - Add persisted/offline-safe retry storage if remote sync retries must survive a full page reload.
  - Add rollback UX only if remote failure should revert local optimistic changes instead of keeping local-first behavior.
  - Add Supabase Realtime only if multi-device live updates become an active product requirement.
- **Packaging**:
  - Package the app as a native-feeling macOS desktop app via Tauri.

---

# GridSet 요구사항

## 1. 제품 비전
GridSet은 빠르고 키보드 친화적인 루틴 구성 및 세트 입력 흐름을 원하는 MacBook 사용자를 위한 데스크톱 우선 운동 기록 웹 앱이다. 앱의 느낌은 일반적인 피트니스 대시보드보다 집중도 높은 네이티브 macOS 유틸리티에 가까워야 한다. 어둡고, 조밀하고, 반응성이 좋으며, 반복해서 사용해도 만족스러운 경험을 목표로 한다.

## 2. 현재 제품 범위
- **목표 플랫폼**: MacBook 크기 화면과 데스크톱 창 해상도에 최적화된 데스크톱 웹.
- **현재 모드**: 로컬 게스트 모드와 선택적 Supabase Auth 계정 동기화.
- **현재 영속성**: 브라우저 `localStorage` 기반 Zustand Persist. 로그인 사용자는 Supabase를 원격 데이터베이스 소스로 사용한다.
- **현재 데이터 모델**: Supabase 데이터베이스 스키마와 대응되는 로컬 UUID 기반 엔티티.
- **초기 로컬 경험**: 새 게스트 저장소는 풍부한 데모 운동 데이터로 시드되어 루틴, 로그, 차트, 캘린더가 채워진 상태로 앱을 시작한다.
- **모바일 지원**: 현재 단계에서는 필요하지 않다. MacBook 데스크톱 사용성에 집중한다.
- **향후 패키징**: Tauri 기반 macOS 데스크톱 앱 래퍼.

## 3. 구현된 내비게이션
GridSet은 마우스 의존도를 줄이기 위해 최상위 탭과 하위 탭 수준의 고성능 키보드 단축키 내비게이션을 지원한다.
- **메인 탭**:
  - `Q` -> Routine 페이지(`routine`): 루틴 및 세션 템플릿 편집.
  - `W` -> Set 페이지(`set`): 실시간 운동 세트 입력 그리드와 타이머.
  - `E` -> Log 페이지(`log`): 운동 기록, 캘린더, 진행 통계.
- **Log 하위 탭**(Log 탭이 활성화된 경우):
  - `A` -> 일일 로그 및 캘린더 보기.
  - `S` -> 운동별 진행 지표와 히스토리 차트.
  - `D` -> 루틴 히스토리 타임라인과 구성 변화.
- **포커스 동작**:
  - `Esc`는 활성 탭의 주요 상호작용 컨테이너로 포커스를 복귀시키거나 현재 입력 포커스를 해제한다.
  - 방향키, `Tab`, `Shift + Tab`은 hover 잔상 없이 포커스를 깔끔하게 이동한다.

## 4. 구현된 Routine 페이지
Routine 탭은 재사용 가능한 운동 템플릿과 세션 계획을 관리한다.

### 4.1 루틴 관리
- 새 루틴 생성.
- 기존 루틴 복제. 세션과 세션별 운동 목표값도 함께 복제된다.
- 루틴 이름 변경.
- 루틴 삭제. 포함된 세션과 세션-운동 연결도 함께 삭제된다.
- 가로 루틴 목록에서 루틴 선택.

### 4.2 세션 관리
- 루틴 안에서 세션 생성, 이름 변경, 삭제, 선택.
- 세션은 루틴 내부 순서를 가지며 `Day A`, `Day B` 등으로 표시된다.
- 각 루틴은 일회성 또는 보강 운동 구성을 위한 임시 세션(`session_order = 0`)을 하나 가질 수 있다. 임시 세션은 정규 세션 순서와 7개 세션 제한에서 제외된다.
- 세션 삭제 시 남은 세션의 순서가 압축된다.
- 키보드 지원:
  - 방향키로 세션 사이를 이동한다.
  - `Cmd`/`Ctrl` + `Arrow Up`/`Down`으로 세션 순서를 변경한다.

### 4.3 세션 운동 관리
- 자동완성으로 세션에 운동을 추가한다.
- 사전에 없는 운동은 커스텀 운동으로 추가할 수 있다.
- 같은 세션 안에서 중복 운동 추가를 방지한다.
- 세션에서 운동을 삭제하면 남은 운동 순서가 압축된다.
- 키보드 지원:
  - 방향키로 운동 사이를 이동한다.
  - `Cmd`/`Ctrl` + `Arrow Up`/`Down`으로 운동 순서를 변경한다.
  - `Arrow Right`로 목표 기록 편집 영역에 진입한다.
- 운동별 템플릿 설정:
  - 목표 세트 수.
  - 목표 기록(횟수 또는 초).
  - 세트 간 휴식 시간.
  - 운동 후 휴식 시간.
  - 편측성 운동 설정 표시.

## 5. 구현된 Set 페이지
Set 탭은 실시간 운동 입력의 핵심 화면이다.

### 5.1 세션 선택
- Set Grid 헤더에 조밀한 드롭다운 세션 선택기가 있다.
- 최근 운동 로그를 기반으로 다음 세션이 기본 선택된다.

### 5.2 운동 정보 패널
- 선택된 운동 이름을 보여준다.
- 완료된 세트 기록을 기반으로 70일 활동 히트맵을 보여준다.
- 중량 운동은 일별 최고 중량, 맨몸/시간 기반 운동은 일별 최고 횟수 또는 초를 기준으로 진행 차트를 보여준다.
- 운동 단위에 따라 전체 누적 볼륨, 횟수, 시간을 보여준다.

### 5.3 세트 입력 그리드
- 선택된 세션 템플릿의 각 운동을 세트 입력 블록으로 렌더링한다.
- 편측성 운동을 지원하며 세트별 좌/우 방향을 표시한다.
- 초기 행 수는 각 운동의 목표 세트 수를 따른다.
- 중량과 횟수 입력은 숫자 입력으로 제한된다.
- **Excel 방식 셀 키보드 이동**:
  - `Arrow Up`/`Down`은 같은 열에서 위/아래 행으로 포커스를 이동한다.
  - `Arrow Left`/`Right`는 텍스트 커서가 입력값 경계에 있을 때 좌우 셀로 이동한다.
  - `Enter`는 같은 열의 다음 세트 행으로 이동한다.
  - `Tab`/`Shift+Tab`은 셀을 순차적으로 앞뒤 이동한다.
- **특수 Tab 및 키바인드 동작**:
  - **첫 중량 Tab 자동 채우기**: 운동 블록의 첫 세트 `weight` 입력 후 `Tab`을 누르면 같은 운동의 이후 세트 중량에 같은 값이 자동 복사된다.
  - **Reps Tab 휴식 타이머 트리거**: 숫자 `reps` 셀에서 `Tab`을 누르면 해당 세트가 완료 처리되고 템플릿의 세트 간 휴식 시간에 따라 자동 휴식 타이머가 시작된다.
  - **수동 행 추가**: `Tab`은 세트 행을 자동으로 추가하지 않는다. 빠른 입력 중 그리드가 실수로 늘어나지 않도록 추가 세트는 보이는 `세트 추가` 버튼으로만 만든다.
  - **Backquote(\`) 메모 전환**: `` ` `` 또는 `₩` 키로 활성 스프레드시트 셀과 하단 세트별 메모 textarea 사이의 키보드 포커스를 즉시 전환한다.
- 수동 `세트 추가` 버튼은 해당 운동에 세트 행을 하나 더 추가한다.
- 하단 세트 메모 입력은 현재 포커스된 세트에 귀속되며, 포커스 이동에 따라 표시 내용이 바뀐다.
- "Finish Workout" / "Save Session" 버튼은 입력 초안을 영구 히스토리(`workoutLogs`, `setRecords`)로 저장한다. 버튼에 포커스가 있을 때 `Enter`로 제출할 수 있다.

### 5.4 과거 로그 패널
- 선택된 운동의 완료된 과거 세트 기록을 보여준다.
- 기록을 운동 로그 날짜별로 그룹화한다.
- 최신 기록이 먼저 오도록 정렬한다.
- 각 날짜의 총 볼륨/횟수/시간과 읽기 전용 세트 행을 표시한다.

## 6. 구현된 Log 페이지
Log 탭은 완료된 운동, 진행 분석, 템플릿 히스토리를 종합적으로 보여주는 대시보드다.

### 6.1 일일 로그 하위 탭 (`A`)
- **인터랙티브 캘린더 그리드**: 운동 완료일은 점으로 강조된다. 사용자는 날짜를 클릭해 해당 날짜 기록으로 이동할 수 있다.
- **일일 요약 카드**: 선택한 날짜의 모든 완료 운동을 표시한다. 각 카드는 시작/종료 시간, 총 볼륨, 완료 세트 수, 세션 메타데이터를 요약한다.
- **상세 세트 기록 목록**: 기록된 운동별 세트 그리드를 읽기 전용으로 렌더링한다. 편측 표시, 횟수/중량, 개인 메모를 포함한다.

### 6.2 운동별 인사이트 (단축키 `S`)
- **인터랙티브 운동 선택기**: 사용자의 히스토리에 등장한 모든 운동을 빠르게 선택할 수 있다.
- **퍼포먼스 차트**: 시간에 따른 일별 최고 기록을 그린다. 운동 단위에 따라 최고 중량, 최고 횟수, 최고 초로 반응한다.
- **통합 지표 카드**: 전체 최고 중량, 최고 횟수, 총 볼륨, 완료 세트 수 같은 핵심 지표를 보여준다.
- **동적 캘린더 강조**: 해당 운동을 수행한 모든 날짜를 미니 캘린더에 표시한다.

### 6.3 루틴 타임라인 하위 탭 (`D`)
- **운동 루틴 구성 추적**: 루틴 템플릿의 시간순 히스토리를 구성한다.
- 세션이나 운동이 템플릿 안에서 수정, 추가, 삭제된 시점을 보여준다.
- 세션별 운동 구성, 목표 세트, 목표 기록의 전체 요약을 표시한다.

## 7. 구현된 도움말 및 데모 데이터
GridSet은 초기 사용 진입 장벽을 낮추기 위해 풍부한 데모 데이터와 언제든 열 수 있는 도움말/데이터 관리 모달을 제공한다.

### 7.1 데모 데이터
- 첫 게스트 저장소는 수동 데모 데이터 액션과 같은 구조화된 데모 데이터 생성기로 초기화된다.
- 데모 데이터는 루틴, 세션, 세션 운동, 운동 로그, 세트 기록을 채워 차트, 캘린더, 과거 로그, 루틴 타임라인이 처음부터 의미 있게 보이도록 한다.
- 사용자는 Help 모달에서 현재 작업공간을 새 데모 데이터로 교체할 수 있다.

### 7.2 인터랙티브 데이터 관리
- 사용자는 우측 상단의 "도움말" 모달을 언제든 열 수 있다.
- 메인 탭, 세트 그리드, 루틴 편집기, 운동 검색, 로그 패널의 키보드 단축키를 여러 카드로 보여준다.
- **데이터 액션**:
  - **데모 데이터 로드**: 현재 데이터를 풍부한 구조화 데모 히스토리로 교체한다.
  - **기록 전체 초기화**: 모든 데이터를 삭제하고 빈 작업공간으로 초기화한다.
- 두 액션 모두 실수 방지를 위해 커스텀 확인 오버레이(`help-confirm-overlay`)로 보호된다.

### 7.3 현재 구현되지 않은 항목
- 현재 코드베이스에는 별도의 슬라이드형 온보딩 모달이 없다.
- 현재 영속성 스키마에는 `hasCompletedOnboarding` 상태가 없다.

## 8. 운동 검색 및 사전
- 로컬 오프라인 운동 사전(`exerciseDictionary.js`)을 사용한다.
- 한국어와 영어 보디빌딩/피트니스 용어 및 동의어를 포함한다.
- 한국어 이름 검색, 초성 검색(`ㅂㅊ`), 부분 한글 조합 매칭을 지원한다.
- 영어 이름과 동의어 검색을 지원한다.
- 시각적 정돈을 위해 자동완성 제안은 8개로 제한한다.
- 사용자는 주동근, 장비, 기록 단위, 편측성 여부를 선택해 커스텀 운동을 생성할 수 있다.

## 9. 상태 및 데이터 관리
- 전역 앱 상태는 Zustand로 관리한다.
- 로그인 사용자는 Supabase를 통해 데이터를 hydrate하고 write-through 방식으로 동기화한다.
- 게스트 사용자는 로컬 전용 데이터를 계속 사용할 수 있으며, 데이터는 브라우저 `localStorage`에 Zustand Persist로 안전하게 저장된다. 스키마 버전 마이그레이션도 유지된다.
- **게스트에서 회원으로 마이그레이션**: 게스트 사용자가 로그인하면 기존 로컬 루틴, 세션, 세션 운동, 로그, 세트 기록이 Supabase 원격 데이터베이스로 자동 마이그레이션 및 동기화된다.
- **원격 동기화 실패 UX**:
  - 로컬 변경은 원격 쓰기보다 먼저 즉시 반영된다.
  - 실패한 백그라운드 원격 쓰기 작업은 메모리 기반 재시도 큐에 저장된다.
  - 로그인 사용자는 우측 상단 동기화 실패 배너에서 실패한 작업 종류, 대기 작업 수, 재시도 버튼을 볼 수 있다.
  - 사용자가 게스트 모드로 돌아가거나 대기 중인 쓰기가 모두 성공하면 재시도 큐가 비워진다.
- **영속 저장되는 상태 엔티티**:
  - `currentUser`
  - `exercises` (`is_unilateral` 필드 포함)
  - `routines`
  - `sessions`
  - `sessionExercises`
  - `workoutLogs`
  - `setRecords` (L/R/both 방향과 세트별 메모 포함)
  - `isSyncing`
  - `authSession`
- **영속 저장되지 않는 런타임 상태**:
  - `remoteSyncError`는 Zustand Persist에서 의도적으로 제외되며, 현재 런타임의 재시도 큐 상태만 반영한다.
- **동기화 최적화**: 로컬 데이터 변경은 즉시 적용되고 원격 쓰기는 백그라운드 작업으로 실행된다. transient failure 이후 재시도를 지원하기 위해 생성성 원격 쓰기에는 가능한 경우 idempotent `upsert` 경로를 사용한다.

## 10. 테스트 요구사항
현재 자동화 테스트는 다음을 다룬다.
- 한글 분해, 초성 추출, 한글 매칭.
- 운동 자동완성 랭킹과 필터링.
- 세션 요일 포맷팅.
- 세트 그리드 모델 생성, 평탄화, 삽입 위치 계산, 숫자 입력 검증.
- 운동 스토어 동작:
  - 운동 중복 방지.
  - 루틴/세션/세션 운동 생성.
  - 임시 세션 생성 및 순서 규칙.
  - 삭제 cascade.
  - 순서 압축.
  - 루틴 복제.
  - 운동 로그 삭제 시 세트 기록 cascade 삭제.
- Supabase 동기화 동작:
  - 공용 운동 hydrate.
  - 외래키 참조를 위한 커스텀 운동 업로드.
  - 공용 마스터 운동 row는 사용자 커스텀 row로 다시 업로드하지 않음.
  - 실패한 원격 쓰기는 재시도 가능한 동기화 상태를 노출하고 성공 재시도 후 해제됨.

## 11. 현재 아키텍처 노트
- **유틸리티 로직 분리**: 계산과 포맷 같은 순수 유틸리티 로직은 `src/utils/`에 위치한다.
- **상태 스토어 분리**: Zustand 상태와 로컬 영속성은 `src/store/useWorkoutStore.js`에 위치한다.
- **데이터 영속성 마이그레이션**: 스키마 마이그레이션 로직은 `src/store/workoutPersistenceMigration.js`에 분리되어 있다.
- **Repository 패턴**: Supabase 읽기/쓰기 로직은 `src/api/supabaseWorkoutRepository.js`에 분리되어 있다.
- **앱 모듈화를 위한 커스텀 훅**:
  - `useGlobalShortcuts.js`와 `useTabNavigation.js`는 전역 키바인드 리스너를 분리한다.
  - `useWorkoutSessionRotation.js`는 세션 선택 로직을 분리한다.
  - `useAuthSessionBridge.js`는 Supabase auth 상태와 Zustand를 연결한다.
  - `useWorkoutDraft.js`는 Set Grid 입력 버퍼 변경을 영속 상태와 분리한다.
- **동기화 실패 UI**: `src/components/SyncStatusBanner.jsx`는 로그인 사용자에게 재시도 가능한 원격 쓰기 실패를 렌더링한다.
- **데모 데이터 생성**: 시드 생성 로직은 `src/data/dummyGenerator.js`에 분리되어 있다.

## 12. 향후 요구사항
- **운동 수행**:
  - 저장된 루틴 템플릿을 수정하지 않고 단일 운동 수행에서만 운동을 대체하는 기능 추가.
- **Supabase 통합**:
  - 원격 동기화 재시도가 전체 페이지 새로고침 이후에도 살아남아야 한다면 persisted/offline-safe retry storage 추가.
  - 원격 실패 시 로컬 우선 동작을 유지하는 대신 낙관적 변경을 되돌려야 한다면 rollback UX 추가.
  - 다중 기기 실시간 업데이트가 실제 제품 요구사항이 되는 경우에만 Supabase Realtime 추가.
- **패키징**:
  - Tauri로 네이티브에 가까운 macOS 데스크톱 앱 패키징.
