# GridSet Sync Policy

GridSet treats workout records as durable personal history. Sync behavior must avoid overwriting or mixing a user's existing server data with unrelated guest-local data from the current browser.

## Sources Of Truth

- Guest mode uses browser `localStorage` only.
- Signed-in mode uses Supabase as the source of truth.
- After a user is signed in, local changes are allowed to write through to Supabase.
- Guest-local data is not automatically trusted just because a login happened.

## Demo Data State

New guest stores start with bundled demo data so the app is useful on first launch.

- `hasClearedDemoData: false` means the current guest workspace is still considered demo-derived.
- `clearAllData()` or the signup discard flow sets `hasClearedDemoData: true`.
- Loading demo data again sets `hasClearedDemoData: false`.

Only data created after the demo has been cleared is eligible for guest-to-server migration.

## Login And Signup Rules

When a guest transitions to a signed-in user:

1. Snapshot the guest-local state before changing the current user.
2. Clear local workout data from the signed-in store immediately.
3. Fetch the signed-in user's Supabase data.
4. If Supabase already has any workout data, keep the server data and discard the guest snapshot.
5. If Supabase is empty and the guest snapshot is eligible, upload the snapshot to Supabase.
6. Fetch Supabase again after the upload and hydrate the app from the server.

The guest snapshot is eligible only when:

- `hasClearedDemoData === true`
- The snapshot contains local workout data.
- The server account has no workout data.

Server data is considered non-empty if it has any user routines, sessions, session exercise links, groups, workout logs, set records, or user-owned custom exercises.

## Signup Warning

If a guest signs up while the workspace is still demo-derived, the auth modal warns that the current guest-local data will be deleted and the new account will start empty.

Before calling Supabase signup, the app discards that guest-local data. This prevents Supabase auth callbacks from seeing demo data and accidentally uploading it.

If the guest already cleared the demo and created local records, no warning is shown. That data may migrate, but only if the new server account is empty.

## Existing Account Login

If an existing account already has server data, guest-local data from the current browser is discarded without a warning. This is intentional: server history is safer than merging unknown local state.

## Prohibited Behavior

- Do not upload demo-derived guest data to Supabase.
- Do not upload guest-local data into an account that already has server data.
- Do not expose a general-purpose "migrate local data to server" store action.
- Do not replace or clear server records as part of login.

## Current Implementation

- `src/store/slices/authSlice.js`
  - `setAuthSession()` owns guest-to-user transition logic.
  - `createGuestDataSnapshot()` captures guest data before login state changes.
  - `hasServerWorkoutData()` decides whether the server is empty.
- `src/store/slices/workoutLogSlice.js`
  - `clearAllData()` marks guest demo data as cleared.
  - `generateDummyData()` marks the workspace as demo-derived.
- `src/components/AuthModal.jsx`
  - Shows the signup discard warning for demo-derived guest workspaces.
