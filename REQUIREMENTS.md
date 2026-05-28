# GridSet Requirements

## 1. Product Vision
GridSet is a desktop-first workout logging web app for MacBook users who want a fast, keyboard-friendly routine and set-entry workflow. The app should feel closer to a focused native macOS utility than a generic fitness dashboard: dark, compact, responsive, and satisfying to use repeatedly.

## 2. Current Product Scope
- Target platform: desktop web, optimized for MacBook-sized screens.
- Current mode: local guest mode only.
- Current persistence: Zustand Persist with browser `localStorage`.
- Current data model: local UUID-based entities that mirror the planned Supabase schema.
- Mobile support: not required for the current phase.
- Future packaging: Tauri-based macOS desktop app.

## 3. Implemented Navigation
- Top-centered tab navigation with `R` Routine, `S` Set, and `L` Log.
- Default active tab is `S`.
- `R`, `S`, and `L` are implemented.

## 4. Implemented Routine Tab (`R`)
The Routine tab manages reusable workout templates.

### 4.1 Routine Management
- Create a new routine.
- Duplicate an existing routine, including sessions and session exercise targets.
- Rename a routine.
- Delete a routine and cascade-delete its sessions and session exercise links.
- Select a routine from a horizontal routine list.

### 4.2 Session Management
- Create, rename, delete, and select sessions inside a routine.
- Sessions have routine-local order and are displayed as `Day A`, `Day B`, etc.
- Deleting a session compacts remaining session order.
- Keyboard support:
  - Arrow keys move between sessions.
  - Cmd/Ctrl + Arrow Up/Down reorders sessions.

### 4.3 Session Exercise Management
- Add exercises to a session through autocomplete.
- Add custom exercises when no dictionary result exists.
- Prevent duplicate exercises inside the same session.
- Delete exercises from a session and compact remaining order.
- Keyboard support:
  - Arrow keys move between exercises.
  - Cmd/Ctrl + Arrow Up/Down reorders exercises.
  - Arrow Right moves into target record editing.
- Per-exercise template settings:
  - Target sets.
  - Target record, such as reps or seconds.
  - Rest time between sets.
  - Rest time after exercise.
  - Unilateral (편측성) setting configuration display.

## 5. Implemented Set Tab (`S`)
The Set tab is the current workout-entry surface.

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
- Supports Excel-like keyboard movement through cells:
  - Arrow Up/Down.
  - Arrow Left/Right at cursor boundaries.
  - Enter moves downward.
  - Tab/Shift+Tab moves through cells.
- Tab on the final rendered cell adds a new set row.
- The manual `세트 추가` button adds another set row for an exercise.
- Per-set memo input at the bottom of the grid, updated as the user focuses on different sets.
- Rest timer starts upon set completion.

### 5.4 Past Logs Panel
- Shows completed historical set records for the selected exercise.
- Groups records by workout log date.
- Sorts past logs newest first.
- Displays each date's total volume/count/time and readonly set rows.

## 6. Exercise Search
- Uses a local offline exercise dictionary.
- Supports Korean name search, chosung search (`ㅂㅊ`), and partial Hangul composition matching.
- Supports English names and synonyms.
- Limits autocomplete suggestions to 8 results.
- Allows custom exercise creation with selected primary muscle, equipment, and unilateral flag.

## 7. State And Data
- Global app state is managed with Zustand.
- Persisted local entities:
  - `currentUser`
  - `exercises` (includes `is_unilateral`)
  - `routines`
  - `sessions`
  - `sessionExercises`
  - `workoutLogs`
  - `setRecords` (includes `side` field: 'L', 'R', 'both')
- Debug utilities are available in the UI:
  - Generate dummy data.
  - Clear all data.

## 8. Testing Requirements
Current automated tests cover:
- Hangul decomposition, chosung extraction, and Hangul matching.
- Exercise autocomplete ranking and filtering.
- Session day formatting.
- Set grid model generation, flattening, insert-position calculation, and numeric input validation.
- Workout store behavior:
  - Exercise duplicate prevention.
  - Routine/session/session-exercise creation.
  - Delete cascades.
  - Order compaction.
  - Routine duplication.
  - Workout log deletion cascading to set records.

## 9. Current Architecture Notes
- Pure utility logic lives in `src/utils`.
- Shared state and local persistence live in `src/store/useWorkoutStore.js`.
- UI components are in `src/components`.
- `RoutineDetail.jsx` has been refactored and modularized into subcomponents in `src/components/routine/`.
- **Maintainability Risks**:
  - `useWorkoutStore.js` is over 1100 lines long, largely due to dummy data generation logic. This must be extracted.
  - `App.jsx` handles too many responsibilities including global shortcuts and complex session rotation logic.
  - `ExerciseInfo` and `PastLogs` both derive historical record summaries individually.
  - `SetGrid` currently holds draft set inputs in component state (`blocks`). A "Finish Workout" / "Save Session" workflow is required to persist them to `workoutLogs` and `setRecords`.

## 10. Future Requirements
- **Refactoring & Modularization**:
  - Extract dummy data generation from `useWorkoutStore.js`.
  - Extract global keyboard shortcuts and session rotation logic from `App.jsx`.
- **Workout Execution**:
  - Implement actual workout start/finish flow to persist Set tab entries into `workoutLogs` and `setRecords`.
  - Add exercise substitution for a single workout without modifying the saved routine template.
- **Supabase Integration**:
  - Replace/sync local Zustand persistence with Supabase Postgres database.
  - Implement Auth, real-time sync, and remote data fetching.
- **Packaging**:
  - Package the app as a native-feeling macOS app via Tauri.
