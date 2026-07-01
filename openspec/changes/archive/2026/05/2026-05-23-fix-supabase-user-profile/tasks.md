## 1. SupabaseAuthSync — profile extraction

- [x] 1.1 Add `onUserEmailUpdate` and `onUserPictureUpdate` to `SupabaseAuthSyncProps` (FR1)
- [x] 1.2 Extract email and avatar on `SIGNED_IN` from `session.user` (FR2)
- [x] 1.3 Extract profile on `INITIAL_SESSION` only if no cache in localStorage (FR3)
- [x] 1.4 Skip profile extraction on `TOKEN_REFRESHED` (FR4)
- [x] 1.5 Remove avatar cache from localStorage on `signOut` (FR5)

## 2. AuthProvider — pass callbacks

- [x] 2.1 Pass `handleUserEmailUpdate` and `handleUserPictureUpdate` to `<SupabaseAuthSync>` (FR6)

## 3. Tests

- [x] 3.1 Update existing SupabaseAuthSync tests — add new props to all renders
- [x] 3.2 Test: on `SIGNED_IN`, `onUserEmailUpdate` and `onUserPictureUpdate` are called with session.user data (FR2)
- [x] 3.3 Test: on `INITIAL_SESSION` without cache — profile is extracted (FR3)
- [x] 3.4 Test: on `INITIAL_SESSION` with cache — `onUserPictureUpdate` is not called (FR3)
- [x] 3.5 Test: on `TOKEN_REFRESHED` — profile callbacks are not called (FR4)
- [x] 3.6 Test: on `signOut` — localStorage[USER_PICTURE] is removed (FR5)
- [x] 3.7 Test: fallback to `user_metadata.picture` when `avatar_url` is absent (FR2)

## 4. Verification

- [x] 4.1 All existing and new tests pass (`cd packages/client && npx vitest run src/app/providers/SupabaseAuthSync.test.tsx`)
- [x] 4.2 Build passes without errors (`pnpm run build`)
- [x] 4.3 Manual check: authenticate via Supabase Google OAuth → avatar is displayed in RightFilterPanel (UX1)
