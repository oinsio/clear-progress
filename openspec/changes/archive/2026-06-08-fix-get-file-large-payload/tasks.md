## 1. Fix server-side base64 encoding (FR1)

- [x] 1.1 Add `uint8ArrayToBase64` helper to `supabase/functions/_shared/files.ts` — chunked `String.fromCharCode` with 8192-byte chunks (D1, D2 of design)
- [x] 1.2 Replace `btoa(String.fromCharCode(...bytes))` in `get-file/index.ts` with `uint8ArrayToBase64` call (FR1)

## 2. Integration test (FR1, FR2, M2)

- [x] 2.1 Use real 441 KB JPEG fixture (`packages/integration/src/fixtures/primula.jpeg`) in `file-download-cross-device.spec.ts` to reproduce the original 500 error
- [x] 2.2 Verify `file-download-cross-device.spec.ts` passes with the fix — Device B can preview and download the 441 KB file (UX1, UX2)
- [x] 2.3 Run integration test — confirm it passes with the fix and would fail without it

## 3. Deploy and verify (M1)

- [x] 3.1 Deploy `get-file` Edge Function to production
- [x] 3.2 Verify the original bug scenario on real devices — attach file on Device A, sync, open on Device B
