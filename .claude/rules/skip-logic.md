---
paths:
  - "packages/client/src/utils/repeatRule.ts"
---

# Rule: skip missed recurring task recurrences

**Decision** (see docs/adr/0002-recurring-tasks-skip-logic.md):

- When `next_date` falls in the past (user was inactive), skip to the nearest future date
- Never accumulate missed recurrences — create only one copy with the next valid date
- `after_completion` type does NOT use skip logic — date is always `completedAt + delay_days`
- Skip logic applies to: daily, weekly, monthly, yearly frequencies

**Algorithm:**
1. Calculate `next = prev + interval`
2. If `next < today`: compute `periodsToSkip = ceil(daysSincePrev / interval)`, then `next = prev + periodsToSkip * interval`
3. Result: nearest date >= today

**What NOT to do:**
- Do not create multiple copies for missed days
- Do not show "missed N recurrences" notifications
- Do not apply skip logic to `after_completion` rules
