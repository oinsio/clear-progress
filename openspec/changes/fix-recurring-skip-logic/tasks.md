## 1. Tests (RED) — daily skip logic

- [ ] 1.1 Add daily skip test: interval=1, prev=2026-04-10, today=2026-04-16, expect 2026-04-17 (FR1, FR5)
- [ ] 1.2 Add daily skip test: interval=3, prev=2026-04-10, today=2026-04-20, expect 2026-04-23 (FR1, FR5)
- [ ] 1.3 Add daily early completion test: interval=1, prev=2026-07-05, today=2026-07-03, expect 2026-07-04 (FR2, FR5)
- [ ] 1.4 Run tests — confirm new tests FAIL (RED)

## 2. Fix calculateNextDateDaily (GREEN)

- [ ] 2.1 Simplify `calculateNextDateDaily` to return `today + interval` (FR1, FR2, design D1)
- [ ] 2.2 Run all repeatRule tests — confirm all pass (GREEN)

## 3. Tests (RED) — yearly boundary

- [ ] 3.1 Add yearly skip test: prev=2024-03-15, today=2026-03-15, expect 2027-03-15 (FR3)
- [ ] 3.2 Run tests — confirm new test FAILS (RED)

## 4. Fix calculateNextDateYearly (GREEN)

- [ ] 4.1 Change boundary in `calculateNextDateYearly` from `< 0` to `<= 0` (FR3, design D2)
- [ ] 4.2 Run all repeatRule tests — confirm all pass (GREEN)

## 5. Update existing tests

- [ ] 5.1 Fix existing yearly skip test that expects today (2026-03-15) — should now expect 2027-03-15 if applicable
- [ ] 5.2 Fix existing daily non-skip tests if any expect schedule-aligned results instead of today+interval
- [ ] 5.3 Run full test suite — confirm all pass

## 6. Documentation

- [ ] 6.1 Update ADR-0002: fix daily example (result=today+interval), document two computation models (FR4)
- [ ] 6.2 Update `.claude/rules/skip-logic.md`: document Model A (daily) and Model B (weekly/monthly/yearly) (FR4)

## 7. Verification

- [ ] 7.1 Run `pnpm run build` — confirm no build errors
- [ ] 7.2 Run mutation testing on `repeatRule.ts` — target >= 95% (M4)
- [ ] 7.3 Verify ADR-0002 examples match code output (M5)
