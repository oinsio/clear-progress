---
paths:
  - "packages/client/src/utils/repeatRule.ts"
  - "packages/client/src/types/common.ts"
---

# Rule: recurring tasks use current system timezone

**Decision** (see docs/adr/0001-recurring-tasks-timezone-policy.md):

- `RepeatRule` does NOT store a `timeZone` field — this is intentional
- All `next_date` and `appear_date` calculations use `clock.timeZoneId()` (current system timezone)
- When the device timezone changes, subsequent calculations use the new timezone
- Tasks are tied to days and contexts, not absolute moments in time

**What NOT to do:**
- Do not add `timeZone` field to `RepeatRule`
- Do not store timezone at task creation time
- Do not hardcode timezone identifiers — always use `clock.timeZoneId()`

**If tempted to deviate:** Read the ADR — it covers travel, relocation, DST, and after-completion scenarios.
