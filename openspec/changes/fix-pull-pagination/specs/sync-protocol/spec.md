## MODIFIED Requirements

### Requirement: Pull fetches server changes since last known revision
The system SHALL fetch all records with `revision > since_revision` from the server via `pull(PullRequest)`. The response SHALL include `has_more: boolean`. When `has_more` is `true`, the client SHALL repeat the pull using `current_revision` from the response as the new `since_revision`, until `has_more` is `false`. The client SHALL save `last_known_revision` ONLY after receiving `has_more === false`.

#### Scenario: Regular pull fetches changes since last revision
- **WHEN** client has `last_known_revision = 5` and server has records at revisions 6, 7, 8
- **THEN** PullRequest contains `since_revision = 5`
- **AND** response contains records at revisions 6, 7, 8

#### Scenario: Pull with pagination fetches all changes
- **WHEN** client has `last_known_revision = 0` and server has 1500 records
- **AND** PostgREST `max_rows` is 1000
- **THEN** client makes 2 pull requests
- **AND** all 1500 records are applied locally
- **AND** `last_known_revision` is saved only after second response

#### Scenario: Interrupted pagination resumes safely
- **WHEN** client crashes after applying first batch
- **THEN** `last_known_revision` was not updated
- **AND** next sync re-fetches from the same starting revision
