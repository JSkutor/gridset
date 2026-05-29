# GridSet Requirements

## 1. Product Vision
GridSet is a desktop-first workout logging web app for MacBook users who want a fast, keyboard-friendly routine and set-entry workflow. The app should feel closer to a focused native macOS utility than a generic fitness dashboard: dark, compact, responsive, and satisfying to use repeatedly.

## 2. Current Product Scope
- Target platform: desktop web, optimized for MacBook-sized screens.
- Current mode: local guest mode plus optional Supabase Auth account sync.
- Current persistence: Zustand Persist with browser `localStorage`, with Supabase used as the remote source for signed-in users.
- Current data model: local UUID-based entities that mirror the Supabase schema.
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
- Signed-in users hydrate and sync their data through Supabase.
- Guest users can continue using local-only data, and local guest data is migrated to Supabase when a user signs in.
- Persisted local entities:
  - `currentUser`
  - `exercises` (includes `is_unilateral`)
  - `routines`
  - `sessions`
  - `sessionExercises`
  - `workoutLogs`
  - `setRecords` (includes `side` field: 'L', 'R', 'both')
- Debug utilities are available only in development builds:
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
- Supabase sync behavior:
  - Public exercise hydration.
  - Custom exercise upload for foreign-key references.
  - Public master exercise rows are not re-uploaded as user custom rows.

## 9. Current Architecture Notes
- Pure utility logic lives in `src/utils`.
- Shared state and local persistence live in `src/store/useWorkoutStore.js`.
- UI components are in `src/components`.
- `RoutineDetail.jsx` has been refactored and modularized into subcomponents in `src/components/routine/`.
- **Maintainability Status**:
  - `useWorkoutStore.js` has been successfully refactored (dummy data generator extracted into `src/data/dummyGenerator.js`).
  - Supabase read/write concerns are isolated in `src/api/supabaseWorkoutRepository.js`.
  - Persist migration logic is isolated in `src/store/workoutPersistenceMigration.js`.
  - `App.jsx` responsibilities have been modularized using custom hooks (`useGlobalShortcuts.js` and `useSessionRotation.js`).
  - Supabase Auth session bridging is isolated in `src/hooks/useAuthSessionBridge.js`.
  - Account/auth menu UI is isolated in `src/components/AccountMenu.jsx`, and debug utilities are hidden outside development builds.
  - Log summary derivation is isolated in `src/utils/logSummaries.js`.
  - Exercise history metric derivation is isolated in `src/utils/exerciseHistory.js`.
  - Set Grid draft state and mutation logic is isolated in `src/hooks/useWorkoutDraft.js`.
  - `SetGrid` "Finish Workout" / "Save Session" workflow has been implemented to persist inputs to `workoutLogs` and `setRecords`.

## 10. Future Requirements
- **Refactoring & Modularization**:
  - [x] Extract dummy data generation from `useWorkoutStore.js` (Completed)
  - [x] Extract global keyboard shortcuts and session rotation logic from `App.jsx` (Completed)
- **Workout Execution**:
  - [x] Implement actual workout start/finish flow to persist Set tab entries into `workoutLogs` and `setRecords` (Completed)
  - Add exercise substitution for a single workout without modifying the saved routine template.
- **Supabase Integration**:
  - [x] Implement Auth and remote data fetching.
  - [x] Implement optimistic local updates with Supabase write-through sync.
  - [x] Migrate local guest data into Supabase on sign-in.
  - Add rollback/retry UX for failed remote writes.
  - Add Supabase Realtime only if multi-device live updates become a product requirement.
- **Packaging**:
  - Package the app as a native-feeling macOS app via Tauri.
