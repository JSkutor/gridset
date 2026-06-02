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

- `src/store/slices/authSlice.ts`
  - `setAuthSession()` owns guest-to-user transition logic.
  - `createGuestDataSnapshot()` captures guest data before login state changes.
  - `hasServerWorkoutData()` decides whether the server is empty.
- `src/store/slices/workoutLogSlice.ts`
  - `clearAllData()` marks guest demo data as cleared.
  - `generateDummyData()` marks the workspace as demo-derived.
- `src/components/AuthModal.jsx`
  - Shows the signup discard warning for demo-derived guest workspaces.

---

# GridSet 동기화 정책 (한글)

GridSet은 운동 기록을 사용자의 영구적인 개인 이력으로 취급합니다. 동기화 동작은 서버에 이미 있는 사용자 데이터를, 현재 브라우저의 무관한 게스트 로컬 데이터로 덮어쓰거나 섞지 않도록 해야 합니다.

## 진실의 원천(Sources Of Truth)

- 게스트 모드는 브라우저 `localStorage`만 사용합니다.
- 로그인 모드는 Supabase를 진실의 원천으로 사용합니다.
- 사용자가 로그인한 이후에는 로컬 변경 사항이 Supabase로 기록(write-through)될 수 있습니다.
- 로그인만으로 게스트 로컬 데이터가 자동으로 신뢰되지는 않습니다.

## 데모 데이터 상태

새 게스트 저장소는 첫 실행 시 앱이 바로 쓸 수 있도록 번들된 데모 데이터로 시작합니다.

- `hasClearedDemoData: false` — 현재 게스트 워크스페이스가 아직 데모에서 파생된 것으로 간주됩니다.
- `clearAllData()` 또는 가입 시 폐기(discard) 흐름이 `hasClearedDemoData: true`로 설정합니다.
- 데모 데이터를 다시 불러오면 `hasClearedDemoData: false`가 됩니다.

데모를 지운 뒤에 만든 데이터만 게스트→서버 마이그레이션 대상이 됩니다.

## 로그인 및 가입 규칙

게스트가 로그인 사용자로 전환될 때:

1. 현재 사용자를 바꾸기 전에 게스트 로컬 상태의 스냅샷을 만듭니다.
2. 로그인된 저장소에서 로컬 운동 데이터를 즉시 비웁니다.
3. 로그인한 사용자의 Supabase 데이터를 가져옵니다.
4. Supabase에 이미 운동 데이터가 있으면 서버 데이터를 유지하고 게스트 스냅샷은 버립니다.
5. Supabase가 비어 있고 게스트 스냅샷이 조건을 만족하면 스냅샷을 Supabase에 업로드합니다.
6. 업로드 후 Supabase를 다시 가져와 앱을 서버 데이터로 채웁니다(hydrate).

게스트 스냅샷이 마이그레이션 가능한 조건:

- `hasClearedDemoData === true`
- 스냅샷에 로컬 운동 데이터가 있음
- 서버 계정에 운동 데이터가 없음

서버 데이터가 비어 있지 않다고 보는 경우: 사용자 루틴, 세션, 세션-운동 연결, 그룹, 운동 로그, 세트 기록, 사용자 소유 커스텀 운동 중 하나라도 있으면 됩니다.

## 가입 시 경고

워크스페이스가 아직 데모에서 파생된 상태에서 게스트가 가입하면, 인증 모달에서 현재 게스트 로컬 데이터가 삭제되고 새 계정은 빈 상태로 시작한다고 경고합니다.

Supabase 가입 API를 호출하기 전에 해당 게스트 로컬 데이터를 폐기합니다. 이렇게 하면 Supabase 인증 콜백이 데모 데이터를 보고 실수로 업로드하는 일을 막을 수 있습니다.

게스트가 이미 데모를 지우고 로컬 기록을 만든 경우에는 경고를 표시하지 않습니다. 그 데이터는 마이그레이션될 수 있지만, 새 서버 계정이 비어 있을 때만 해당합니다.

## 기존 계정 로그인

서버에 이미 데이터가 있는 기존 계정으로 로그인하면, 현재 브라우저의 게스트 로컬 데이터는 경고 없이 폐기됩니다. 의도된 동작입니다. 알 수 없는 로컬 상태를 합치는 것보다 서버 이력이 더 안전합니다.

## 금지된 동작

- 데모에서 파생된 게스트 데이터를 Supabase에 업로드하지 않습니다.
- 이미 서버 데이터가 있는 계정에 게스트 로컬 데이터를 업로드하지 않습니다.
- 범용 “로컬 데이터를 서버로 마이그레이션” 저장소 액션을 노출하지 않습니다.
- 로그인 과정에서 서버 기록을 대체하거나 지우지 않습니다.

## 현재 구현

- `src/store/slices/authSlice.ts`
  - `setAuthSession()` — 게스트→사용자 전환 로직을 담당합니다.
  - `createGuestDataSnapshot()` — 로그인 상태 변경 전 게스트 데이터를 캡처합니다.
  - `hasServerWorkoutData()` — 서버가 비어 있는지 판단합니다.
- `src/store/slices/workoutLogSlice.ts`
  - `clearAllData()` — 게스트 데모 데이터가 지워졌음을 표시합니다.
  - `generateDummyData()` — 워크스페이스를 데모 파생으로 표시합니다.
- `src/components/AuthModal.jsx`
  - 데모 파생 게스트 워크스페이스에 가입 시 폐기 경고를 표시합니다.
