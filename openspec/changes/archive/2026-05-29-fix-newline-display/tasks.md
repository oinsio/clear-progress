## 1. UI: add whitespace-pre-line

- [x] 1.1 Add `whitespace-pre-line` class to the root `<span>` in `LinkedText` (`packages/client/src/components/ui/LinkedText.tsx:16`) — FR1, FR2, FR3
- [x] 1.2 Add `whitespace-pre-line` class to the description `<p>` in `IdeaItem` (`packages/client/src/components/ideas/IdeaItem.tsx:60`) — FR3
- [x] 1.3 Remove `line-clamp-2` from goal description in `GoalDetailPage` view mode, add `whitespace-pre-wrap` (`packages/client/src/pages/GoalDetailPage.tsx:581`) — FR4

## 2. Tests

- [x] 2.1 Add test in `LinkedText.test.tsx`: root element has `whitespace-pre-line` class — FR1, FR2, FR3
- [x] 2.2 Add test in `IdeaItem` (or existing test file): description element has `whitespace-pre-line` class — FR3

## 3. Verification

- [x] 3.1 Run `npx vitest run LinkedText EditableDescription IdeaItem` — all tests pass
- [x] 3.2 Check diagnostics for changed files via `getDiagnostics`
- [x] 3.3 Run `pnpm run build` — build succeeds
