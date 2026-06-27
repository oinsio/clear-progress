## 1. Implementation — lock-in first-visit default

- [ ] 1.1 Add lock-in guard to `useFilterBarPosition`: persist `platformDefault` to localStorage when `STORAGE_KEYS.FILTER_BAR_POSITION` is null (FR1, FR2)

## 2. Testing

- [ ] 2.1 Unit test (TDD): first visit on desktop persists "top" and returns "top" (FR1)
- [ ] 2.2 Unit test (TDD): first visit on mobile persists "bottom" and returns "bottom" (FR1)
- [ ] 2.3 Unit test (TDD): viewport resize after first visit does not change stored position (FR2)
- [ ] 2.4 Unit test (TDD): explicit user change via settings still overrides stored value (UX3)
- [ ] 2.5 Mutation testing on `useFilterBarPosition.ts` — target >= 95% (M2)

## 3. Verification

- [ ] 3.1 Run `pnpm run build` — no errors
- [ ] 3.2 Check existing command bar tests still pass
