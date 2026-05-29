## 1. UI: add whitespace-pre-line

- [ ] 1.1 Add `whitespace-pre-line` class to the root `<span>` in `LinkedText` (`packages/client/src/components/ui/LinkedText.tsx:16`) — FR1, FR2, FR3
- [ ] 1.2 Add `whitespace-pre-line` class to the description `<p>` in `IdeaItem` (`packages/client/src/components/ideas/IdeaItem.tsx:60`) — FR3

## 2. Tests

- [ ] 2.1 Add test in `LinkedText.test.tsx`: root element has `whitespace-pre-line` class — FR1, FR2, FR3
- [ ] 2.2 Add test in `IdeaItem` (or existing test file): description element has `whitespace-pre-line` class — FR3

## 3. Verification

- [ ] 3.1 Run `npx vitest run LinkedText EditableDescription IdeaItem` — all tests pass
- [ ] 3.2 Check diagnostics for changed files via `getDiagnostics`
- [ ] 3.3 Run `pnpm run build` — build succeeds
