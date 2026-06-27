## 1. Implementation — lock-in first-visit default

- [x] 1.1 Add lock-in guard to `useFilterBarPosition`: persist `platformDefault` to localStorage when `STORAGE_KEYS.FILTER_BAR_POSITION` is null (FR1, FR2)

## 2. Testing

- [x] 2.1 Unit test (TDD): first visit on desktop persists "top" and returns "top" (FR1)
- [x] 2.2 Unit test (TDD): first visit on mobile persists "bottom" and returns "bottom" (FR1)
- [x] 2.3 Unit test (TDD): viewport resize after first visit does not change stored position (FR2)
- [x] 2.4 Unit test (TDD): explicit user change via settings still overrides stored value (UX3)
- [x] 2.5 Mutation testing on `useFilterBarPosition.ts` — target >= 95% (M2)

## 3. Verification

- [x] 3.1 Run `pnpm run build` — no errors
- [x] 3.2 Check existing command bar tests still pass
