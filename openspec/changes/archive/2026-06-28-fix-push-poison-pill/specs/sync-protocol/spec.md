## MODIFIED Requirements

### Requirement: Push result statuses
The server SHALL return a status for each pushed record: `created`, `accepted`, `conflict`, or `rejected`. When status is `rejected`, the result SHALL include a `reason` string with structured format (e.g., `fk_violation:goal_id`, `check_violation:box`, `unique_violation`).

#### Scenario: New record gets status created
- **WHEN** server receives a record whose `id` does not exist on server
- **THEN** result status is `created`

#### Scenario: Updated record wins conflict by timestamp
- **WHEN** client record has `updated_at` >= server record's `updated_at`
- **THEN** result status is `accepted`

#### Scenario: Updated record loses conflict by timestamp
- **WHEN** client record has `updated_at` < server record's `updated_at`
- **THEN** result status is `conflict`
- **AND** result includes `server_record` with server's version

#### Scenario: Record with FK violation is rejected
- **WHEN** a task references a non-existent goal via `goal_id`
- **THEN** result status is `rejected`
- **AND** result includes `reason: "fk_violation:goal_id"`

#### Scenario: Record with CHECK violation is rejected
- **WHEN** a task has an invalid `box` value
- **THEN** result status is `rejected`
- **AND** result includes `reason: "check_violation:box"`

### Requirement: Client handles rejected push results
The client SHALL process `status: "rejected"` results from push. For healable rejections, the client SHALL apply self-healing, set `syncStatus: "pending"`, and retry (max 2 times). For unhealable rejections, the client SHALL set `syncStatus: "rejected"`. The `syncStatus` field replaces the previous `needsSync` boolean.

#### Scenario: Healable rejection triggers self-heal and retry
- **WHEN** server rejects a task with `reason: "fk_violation:goal_id"`
- **THEN** client sets `goal_id = ""`, `syncStatus = "pending"`
- **AND** retries push within same sync cycle

#### Scenario: Unhealable rejection sets rejected status
- **WHEN** server rejects a task with `reason: "check_violation:status"`
- **THEN** client sets `syncStatus = "rejected"`
- **AND** does not retry
