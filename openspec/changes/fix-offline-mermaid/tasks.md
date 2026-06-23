## 1. Build Configuration — Inline Dynamic Imports

- [ ] 1.1 Add `build.rollupOptions.output.inlineDynamicImports: true` to `packages/client/vite.config.ts` (FR1, D1)
- [ ] 1.2 Increase `maximumFileSizeToCacheInBytes` to `6 * 1024 * 1024` in workbox config (NFR-P2, D2)
- [ ] 1.3 Update the comment explaining the size limit
- [ ] 1.4 Run `pnpm run build` and verify single JS output (no separate diagram chunks)
- [ ] 1.5 Verify main bundle size is under 6 MB (NFR-P1)

## 2. MermaidBlock Error Handling

- [ ] 2.1 Write unit test: MermaidBlock shows source code as fallback before render completes (FR2, UX2)
- [ ] 2.2 Write unit test: MermaidBlock shows source code when render fails (FR2, UX2)
- [ ] 2.3 Change MermaidBlock initial state from `return null` to render source code in a styled code block (FR2, D4)
- [ ] 2.4 Run unit tests and verify green

## 3. Verification

- [ ] 3.1 Run `pnpm run build` — verify build succeeds with no errors
- [ ] 3.2 Verify service worker precache manifest includes the larger main bundle (NFR-P2)
- [ ] 3.3 Run mutation testing on MermaidBlock (target >=95%)
