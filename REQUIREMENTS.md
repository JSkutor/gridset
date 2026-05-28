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
- `R` and `S` are implemented.
- `L` is reserved for a future workout log overview and is currently empty.

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

## 5. Implemented Set Tab (`S`)
The Set tab is the current workout-entry surface.

### 5.1 Session Selection
- Shows a routine/session selector when sessions exist.
- Defaults to the first available session when no explicit selection exists.
- Displays session names using `Day X : Session Name`.

### 5.2 Exercise Information Panel
- Shows selected exercise name.
- Shows a 70-day activity heatmap based on completed set records.
- Shows a progress chart using daily peak weight for weighted exercises, or daily peak reps/seconds for bodyweight/time-based exercises.
- Shows all-time total volume/count/time depending on exercise unit.

### 5.3 Set Input Grid
- Renders one set-entry block per exercise in the selected session template.
- Initial row count follows each exercise's target set count.
- Supports numeric-only weight and reps input.
- Supports Excel-like keyboard movement through cells:
  - Arrow Up/Down.
  - Arrow Left/Right at cursor boundaries.
  - Enter moves downward.
  - Tab/Shift+Tab moves through cells.
- Tab on the final rendered cell adds a new set row.
- The manual `세트 추가` button adds another set row for an exercise.
- Exercise focus updates the side panels.
- Session note text area exists, but note persistence is not implemented yet.

### 5.4 Past Logs Panel
- Shows completed historical set records for the selected exercise.
- Groups records by workout log date.
- Sorts past logs newest first.
- Displays each date's total volume/count/time and readonly set rows.

## 6. Exercise Search
- Uses a local offline exercise dictionary.
- Supports Korean name search.
- Supports Korean chosung search, such as `ㅂㅊ`.
- Supports partial Hangul composition matching, useful while Korean IME input is in progress.
- Supports English names and synonyms.
- Ranks exact matches, prefixes, chosung matches, English matches, and synonyms.
- Limits autocomplete suggestions to 8 results.
- Allows custom exercise creation with selected primary muscle and equipment.

## 7. State And Data
- Global app state is managed with Zustand.
- Persisted local entities:
  - `currentUser`
  - `exercises`
  - `routines`
  - `sessions`
  - `sessionExercises`
  - `workoutLogs`
  - `setRecords`
- Debug utilities are available in the UI:
  - Generate dummy data.
  - Clear all data.
- Current dummy data includes routines, sessions, session exercises, workout logs, and completed set records for chart/history views.

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

Run tests with:

```bash
npm test
```

## 9. Current Architecture Notes
- Pure utility logic lives in `src/utils`, including Hangul search, session naming, exercise search, and set grid model helpers.
- Shared state and local persistence live in `src/store/useWorkoutStore.js`.
- UI components are in `src/components`.
- The largest current maintainability risk is `RoutineDetail.jsx`, which combines routine/session/exercise UI, keyboard behavior, inline styling, and template update logic in one large component.
- `ExerciseInfo` and `PastLogs` both derive historical record summaries; this aggregation should eventually move into shared selectors.
- `SetGrid` currently holds draft set inputs in component state only. A save/complete workout workflow is still required before the app can be considered a full workout logger.

## 10. Future Requirements
- Persist actual Set tab entries into `workoutLogs` and `setRecords`.
- Implement workout start/finish flow and set completion states.
- Implement the `L` Log tab for browsing historical workout sessions.
- Add persistent session notes and set-level memos.
- Add rest timer and notifications based on per-exercise rest settings.
- Add exercise substitution for a single workout without modifying the saved routine template.
- Replace or sync local persistence with Supabase.
- Package the app as a native-feeling macOS app via Tauri.
