---
paths:
  - "packages/client/src/utils/repeatRule.ts"
---

# Rule: skip missed recurring task recurrences

**Decision** (see docs/adr/0002-recurring-tasks-skip-logic.md):

- When `next_date` falls in the past (user was inactive), skip to the nearest future date
- Never accumulate missed recurrences — create only one copy with the next valid date
- `after_completion` type does NOT use skip logic — date is always `completedAt + delay_days`

## Two computation models

### Model A: "from today" (daily, after_completion)

```
next_date = today + interval
```

Daily tasks and after_completion always count from today, regardless of the original schedule. The user did it today, the next one is N days from now.

### Model B: "by schedule" (weekly, monthly, yearly)

```
next_date = nearest scheduled date strictly after today (> today)
```

Weekly/monthly/yearly find the next occurrence from the fixed schedule that hasn't happened yet. The interval rhythm is preserved from the original schedule.

## What NOT to do

- Do not create multiple copies for missed days
- Do not show "missed N recurrences" notifications
- Do not apply skip logic to `after_completion` rules
- Do not use `>= today` for schedule-based frequencies — always strictly `> today`
- Do not use schedule-aligned skip for daily — always `today + interval`
