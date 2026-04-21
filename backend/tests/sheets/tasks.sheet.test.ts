import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllTasks, upsertTasks } from '../../src/sheets/tasks.sheet';
import { makeTask } from '../helpers';
import * as client from '../../src/sheets/client';

vi.mock('../../src/sheets/client');

describe('tasks.sheet - round-trip tests', () => {
  let mockSheet: any;

  beforeEach(() => {
    mockSheet = {
      getDataRange: vi.fn(),
      getRange: vi.fn(),
      appendRow: vi.fn(),
    };
    vi.mocked(client.getSheet).mockReturnValue(mockSheet);
  });

  it('should preserve next_date ISO format after write-read cycle', () => {
    const task = makeTask({ id: 'task-1', name: 'Task 1', next_date: '2026-04-20' });

    // Write: upsertTasks should write with apostrophe prefix
    mockSheet.getDataRange.mockReturnValue({
      getValues: () => [
        ['id', 'name', 'description', 'box', 'goal_id', 'context_id', 'category_id', 'is_completed', 'completed_at', 'repeat_rule', 'is_hidden', 'next_date', 'appear_date', 'original_task_id', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version', 'revision'],
      ],
    });

    upsertTasks([task]);

    // Verify appendRow was called with prefixed date
    expect(mockSheet.appendRow).toHaveBeenCalledTimes(1);
    const appendedRow = mockSheet.appendRow.mock.calls[0][0];
    expect(appendedRow[11]).toBe("'2026-04-20"); // next_date column

    // Read: simulate Google Sheets returning the value without apostrophe (text format)
    mockSheet.getDataRange.mockReturnValue({
      getValues: () => [
        ['id', 'name', 'description', 'box', 'goal_id', 'context_id', 'category_id', 'is_completed', 'completed_at', 'repeat_rule', 'is_hidden', 'next_date', 'appear_date', 'original_task_id', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version', 'revision'],
        ['task-1', 'Task 1', '', 'inbox', '', '', '', false, '', '', false, '2026-04-20', '', '', 0, false, '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', 1, 0],
      ],
    });

    const tasks = getAllTasks();
    expect(tasks[0].next_date).toBe('2026-04-20');
  });

  it('should not corrupt next_date of other tasks during batch upsert', () => {
    const task2 = makeTask({ id: 'task-2', name: 'Task 2', next_date: '2026-04-21' });

    // Initial state: both tasks exist with correct dates
    mockSheet.getDataRange.mockReturnValue({
      getValues: () => [
        ['id', 'name', 'description', 'box', 'goal_id', 'context_id', 'category_id', 'is_completed', 'completed_at', 'repeat_rule', 'is_hidden', 'next_date', 'appear_date', 'original_task_id', 'sort_order', 'is_deleted', 'created_at', 'updated_at', 'version', 'revision'],
        ['task-1', 'Task 1', '', 'inbox', '', '', '', false, '', '', false, '2026-04-20', '', '', 0, false, '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', 1, 0],
        ['task-2', 'Task 2', '', 'inbox', '', '', '', false, '', '', false, '2026-04-21', '', '', 0, false, '2025-01-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z', 1, 0],
      ],
    });

    const mockRange = {
      setValues: vi.fn(),
    };
    mockSheet.getRange.mockReturnValue(mockRange);

    // Update only task2
    upsertTasks([{ ...task2, name: 'Task 2 Updated' }]);

    // Verify task1's row was NOT touched
    expect(mockRange.setValues).toHaveBeenCalledTimes(1);
    const updatedRow = mockRange.setValues.mock.calls[0][0][0];
    expect(updatedRow[0]).toBe('task-2'); // Only task2 was updated

    // Read back: task1's next_date should still be correct
    const tasks = getAllTasks();
    const readTask1 = tasks.find(t => t.id === 'task-1');
    expect(readTask1?.next_date).toBe('2026-04-20');
  });
});
