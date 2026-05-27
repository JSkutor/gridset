# Project Requirements: GridSet

## 1. Product Vision
To build a highly polished, Mac-optimized workout logging web application that feels like a native macOS app. The app must prioritize speed of entry (Excel-like navigation) and visual satisfaction (sleek dark mode, contribution heatmaps).

## 2. Platform & Target Audience
- **Target Audience**: Home-workout enthusiasts using MacBooks.
- **Primary Platform**: Web (Optimized exclusively for Desktop/MacBook).
- **Mobile Support**: Not required for the initial phase.
- **Future Platform**: Native macOS app via Tauri.

## 3. Core Features & Layout

### 3.1 Navigation Bar
- Located top-center.
- Contains three primary tabs: `R` (Routine), `S` (Set), `L` (Log).
- Default active tab is `S`.

### 3.2 Three-Column View (Default 'S' Tab)
#### Column 1: Exercise Information
- Fetch/Display data (e.g., from Kaggle datasets) showing the primary muscle group and an image of the exercise.
- Display an overall progress graph for the selected exercise.
- Display a GitHub-style activity heatmap (commit graph) showing when the exercise was performed.
- Display the total accumulated volume (Weight × Reps) for a sense of accomplishment.

#### Column 3: Set Input (The Grid)
- Excel-like grid interface with columns: `Set`, `Weight (kg)`, `Reps`.
- Must support keyboard navigation (Arrow keys) to move between cells seamlessly.
- Below the grid: A text area for workout notes/memos.
- *(Future)* Auto-generate empty rows based on the user's saved routine.

#### Column 3: Past Logs
- Displays the historical records of the currently selected exercise.
- Grouped by Date (Card format).
- Inside each date card, the past sets are displayed in the same grid format as the input column.

## 4. UI/UX & Design Guidelines
- **Theme**: Dark Mode.
- **Color Palette**: Deep charcoal/black background with subtle neon or metallic accents (e.g., Emerald Green, Space Gray).
- **Aesthetics**: Premium, modern, "Not too flashy but highly sophisticated."
- **Effects**: Utilize Glassmorphism (blur/backdrop-filter), smooth micro-animations, and soft shadows to mimic native macOS applications.

## 5. Technical Architecture
### Phase 1: Prototyping & UI
- **Framework**: React via Vite.
- **Styling**: Vanilla CSS. No Tailwind (to maintain absolute control over native-feeling animations and blur effects).
- **Data Source**: Local dummy JSON files to perfect the UI/UX layout and grid interactions first.

### Phase 2: Backend Integration
- **Database/Auth**: Supabase.
- Store user profiles, custom routines, exercise master data, and set logs.

### Phase 3: Desktop App
- Wrap the React app using Tauri to distribute it as a standalone macOS application.

## 6. Scalability & Extensibility
- **Modular Design**: As this is a personal toy project with many future features planned, the codebase must be designed with high extensibility in mind from day one.
- **Component Reusability**: UI components (buttons, grids, cards) must be highly decoupled and reusable.
- **State Management**: Use scalable state management patterns (e.g., Context API or Zustand) to easily accommodate future complex data flows (e.g., routines, multi-day logs).
- **Clean Architecture**: Separate business logic from UI components to make it easy to swap data sources (e.g., from local JSON to Supabase).
