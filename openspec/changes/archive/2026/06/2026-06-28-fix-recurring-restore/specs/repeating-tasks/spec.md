## ADDED Requirements

### Requirement: System preserves promotion link when soft-deleting a recurring original
# implements FR1 of fix-recurring-restore

When soft-deleting a task that has active copies (promotion occurs), the system SHALL set `original_task_id` of the deleted task to the ID of the promoted copy before marking `is_deleted: true`. This preserves the link between the deleted task and its promoted successor for potential restore.

#### Scenario: softDelete records promoted copy ID in original_task_id
- **GIVEN** task A (id="a", original_task_id="", repeat_rule="daily") with active copy B (original_task_id="a")
- **WHEN** system soft-deletes task A
- **THEN** task B has original_task_id="" (promoted to original)
- **AND** task A has original_task_id="b" and is_deleted=true

#### Scenario: softDelete without copies does not change original_task_id
- **GIVEN** task A (id="a", original_task_id="", repeat_rule="daily") with no copies
- **WHEN** system soft-deletes task A
- **THEN** task A has original_task_id="" and is_deleted=true

#### Scenario: softDelete of non-recurring task does not change original_task_id
- **GIVEN** task A (id="a", original_task_id="", repeat_rule="") with no copies
- **WHEN** system soft-deletes task A
- **THEN** task A has original_task_id="" and is_deleted=true

### Requirement: System prevents duplicate chains when restoring a recurring task
# implements FR2, FR3, FR4, FR5 of fix-recurring-restore

When restoring a soft-deleted task, the system SHALL check whether a promotion occurred (task has non-empty `original_task_id` AND non-empty `repeat_rule`). If the promoted successor is alive (exists and not deleted), the system SHALL clear `repeat_rule`, `next_date`, and `appear_date` on the restored task — it becomes a regular (non-recurring) task. If the promoted successor is deleted or does not exist, the system SHALL clear `original_task_id` and restore the task as a chain original with its `repeat_rule` intact.

#### Scenario: Restore with active promoted successor clears repeat_rule
- **GIVEN** deleted task A (original_task_id="b", repeat_rule="daily") and active task B (id="b", original_task_id="", repeat_rule="daily", is_deleted=false)
- **WHEN** system restores task A
- **THEN** task A has is_deleted=false, repeat_rule="", next_date="", appear_date=""
- **AND** task A has original_task_id="b" (preserved as copy reference)

#### Scenario: Restore with deleted promoted successor restores as original
- **GIVEN** deleted task A (original_task_id="b", repeat_rule="daily") and deleted task B (id="b", is_deleted=true)
- **WHEN** system restores task A
- **THEN** task A has is_deleted=false, original_task_id="", repeat_rule="daily"

#### Scenario: Restore with non-existent promoted successor restores as original
- **GIVEN** deleted task A (original_task_id="b", repeat_rule="daily") and task B does not exist
- **WHEN** system restores task A
- **THEN** task A has is_deleted=false, original_task_id="", repeat_rule="daily"

#### Scenario: Restore with hidden promoted successor clears repeat_rule
- **GIVEN** deleted task A (original_task_id="b", repeat_rule="daily") and task B (id="b", is_hidden=true, is_deleted=false)
- **WHEN** system restores task A
- **THEN** task A has is_deleted=false, repeat_rule="", next_date="", appear_date=""

#### Scenario: Restore task without repeat_rule is unchanged
- **GIVEN** deleted task A (original_task_id="", repeat_rule="")
- **WHEN** system restores task A
- **THEN** task A has is_deleted=false (no other fields changed)

#### Scenario: Restore copy (non-original) is unchanged
- **GIVEN** deleted task B (original_task_id="a", repeat_rule="daily") where B was a copy (not promoted)
- **AND** original_task_id was set before deletion (not by promotion)
- **WHEN** system restores task B
- **THEN** task B has is_deleted=false with original_task_id="a" and repeat_rule="daily" preserved
