## MODIFIED Requirements

### Requirement: Push Edge Function validates and logs rejected records
The push Edge Function SHALL validate incoming records with Zod Wire schemas before passing to RPC. Records failing Zod validation SHALL be excluded from the RPC call and returned with `status: "rejected"`. All rejected records (Zod and RPC) SHALL be logged via `console.warn`.

#### Scenario: Zod-invalid record excluded from RPC
- **WHEN** a task with `created_at = "invalid"` is received in push
- **THEN** the task is NOT passed to `push_records` RPC
- **AND** the task is returned with `status: "rejected"` and Zod error details

#### Scenario: Valid records pass through to RPC
- **WHEN** all records in push pass Zod validation
- **THEN** all records are passed to `push_records` RPC

#### Scenario: Rejected records are logged with details
- **WHEN** 2 records are rejected (1 by Zod, 1 by RPC)
- **THEN** Edge Function logs both rejections with user ID, entity type, record ID, and reason
