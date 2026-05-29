# GridSet Requirements

## 1. Product Vision
GridSet is a desktop-first workout logging web app for MacBook users who want a fast, keyboard-friendly routine and set-entry workflow. The app should feel closer to a focused native macOS utility than a generic fitness dashboard: dark, compact, responsive, and satisfying to use repeatedly.

## 2. Current Product Scope
- **Target platform**: desktop web, optimized for MacBook-sized screens and window resolutions.
- **Current mode**: local guest mode plus optional Supabase Auth account sync.
- **Current persistence**: Zustand Persist with browser `localStorage`, with Supabase used as the remote database source for signed-in users.
- **Current data model**: local UUID-based entities that mirror the Supabase database schema.
- **Mobile support**: not required for the current phase (focus is fully on MacBook desktop ergonomics).
- **Future packaging**: Tauri-based macOS desktop app wrapper.

## 3. Implemented Navigation
Gridset supports high-performance tab-level and sub-tab-level keyboard shortcut navigation to eliminate mouse dependency.
- **Main Tabs**:
  - `Q` -> Routine Tab (`R`) for routine and session template editing.
  - `W` -> Set Tab (`S`) for real-time exercise set-entry grids and timers.
  - `E` -> Log Tab (`L`) for historical diaries, calendars, and progress statistics.
- **Log Sub-Tabs** (accessible when Log Tab is active):
  - `A` -> Daily logs & Calendar view.
  - `S` -> Exercise-specific progress metrics and historical charts.
  - `D` -> Routine historical timeline and structure changes.
- **Focus Mechanics**:
  - `Esc` returns focus to the active tab's primary interaction container.
  - Arrow keys, `Tab`, and `Shift + Tab` shift element focus cleanly without visual hover glitches.

## 4. Implemented Routine Tab (`R`)
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

## 5. Implemented Set Tab (`S`)
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
  - **Row Append Tab**: Pressing `Tab` on the final cell (reps cell) of the final row in an exercise block automatically appends a new set row for that exercise and moves focus to it.
  - **Backquote (\`) Note Toggle**: Pressing the backquote key (`\`` or `₩`) instantly toggles keyboard focus directly between the active spreadsheet cell and the per-set memo textarea at the bottom, allowing seamless note writing.
- The manual `세트 추가` button adds another set row for an exercise.
- Per-set memo input at the bottom of the grid, updated as the user focuses on different sets.
- Includes a "Finish Workout" / "Save Session" button to write draft data to permanent history (`workoutLogs` and `setRecords`) (can be submitted by hitting `Enter` when focused on the button).

### 5.4 Past Logs Panel
- Shows completed historical set records for the selected exercise.
- Groups records by workout log date.
- Sorts past logs newest first.
- Displays each date's total volume/count/time and readonly set rows.

## 6. Implemented Log Tab (`L`)
The Log tab is a comprehensive dashboard of the user's completed exercises, progress analytics, and template history.

### 6.1 Daily Logs Sub-tab (`A`)
- **Interactive Calendar Grid**: Highlighted dots mark completed workout days. Users can click any calendar date to jump to that day's records.
- **Daily Summary Cards**: Displays all workouts completed on the selected date. Each card summarizes start/end time, total volume, sets completed, and session metadata.
- **Detailed Set Record List**: Renders the complete, read-only exercise-by-exercise set grid for each logged workout (including unilateral indicators, reps/weight, and personal memos).

### 6.2 Exercise-specific Insights Sub-tab (`S`)
- **Interactive Exercise Selector**: Quick lookup for all exercises performed in the user's history.
- **Performance Charting**: Draws daily peak records over time. Fully responsive to the selected exercise's specific unit (e.g. Peak Weight for weighted movements, Peak Reps/Seconds for bodyweight/timer movements).
- **Consolidated Metrics Cards**: Shows all-time performance highlights (All-time Max Weight, Max Reps, Total Volumes, Total Sets Completed).
- **Dynamic Calendar Highlights**: Integrates a mini calendar showing every day this specific exercise was performed.

### 6.3 Routine Timeline Sub-tab (`D`)
- **Workout Routine Composition Tracker**: Compiles the chronological history of routine templates.
- Shows when sessions or exercises were modified, added, or deleted inside templates.
- Lists full breakdown summaries of exercises, target sets, and target performance milestones planned for each session.

## 7. Implemented Onboarding & Demo Data
Gridset includes an onboarding experience and robust demo dataset to minimize initial adoption friction.

### 7.1 Onboarding Experience
- First-time users (or users without stored routines/logs) are welcomed by a modern, slide-based `OnboardingModal`.
- **Slide 1: Welcome**: Highlights Gridset's key value propositions (Excel speed layout, automatic rest timers, local guest & Supabase sync).
- **Slide 2: Shortcut Guide**: Prominently displays essential navigation commands (`Q`/`W`/`E`, arrow keys, `Tab`, backquote) to teach users how to use the app mouse-free.
- **Slide 3: Mode Selection**:
  - **Start with Demo Data (Recommended)**: Populates the store with 4 rich routine templates and 50+ actual workout logs spanned across months, allowing the user to experience populated graphs and calendars immediately.
  - **Start Fresh**: Starts with a clean state, showing only the core offline exercise catalog so the user can build templates from scratch.

### 7.2 Interactive Data Management
- Users can access the "도움말" (HelpModal) modal in the top right corner at any time.
- Displays a multi-column cheat sheet of all keyboard shortuts for main tabs, set grids, routine editors, and log panels.
- **Data Action Triggers**:
  - **Load Demo Data**: Wipes current data and populates the rich, structured demo history.
  - **Clear All Data**: Wipes everything and resets the workspace to a blank state.
- Both actions are guarded by a custom double-confirmation overlay (`help-confirm-overlay`) to prevent accidental data loss.

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
- **Guest-to-User Migration**: When a guest user logs in, their existing local routines, sessions, session exercises, logs, and set records are automatically migrated and synchronized up to the Supabase remote database.
- **Persisted State Entities**:
  - `currentUser`
  - `exercises` (with `is_unilateral` field support)
  - `routines`
  - `sessions`
  - `sessionExercises`
  - `workoutLogs`
  - `setRecords` (including L/R/both side designation and set-specific memos)
  - `hasCompletedOnboarding`
- **Sync Optimization**: Local data updates are applied immediately, and a remote write task runs in the background.

## 10. Testing Requirements
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
- **Onboarding and Demo Data Generation**: Seed generation logic is isolated in `src/data/dummyGenerator.js`.

## 12. Future Requirements
- **Workout Execution**:
  - Add exercise substitution for a single workout without modifying the saved routine template.
- **Supabase Integration**:
  - Add rollback/retry UX and UI banner warnings for failed remote writes.
  - Add Supabase Realtime only if multi-device live updates become an active product requirement.
- **Packaging**:
  - Package the app as a native-feeling macOS desktop app via Tauri.
