import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pull } from './pull';
import { ERROR_CODES } from '../helpers/response';

vi.mock('../sheets/tasks.sheet', () => ({ getTasksByRevision: vi.fn() }));
vi.mock('../sheets/goals.sheet', () => ({ getGoalsByRevision: vi.fn() }));
vi.mock('../sheets/contexts.sheet', () => ({ getContextsByRevision: vi.fn() }));
vi.mock('../sheets/categories.sheet', () => ({ getCategoriesByRevision: vi.fn() }));
vi.mock('../sheets/checklists.sheet', () => ({ getChecklistItemsByRevision: vi.fn() }));
vi.mock('../sheets/ideas.sheet', () => ({ getIdeasByRevision: vi.fn() }));
vi.mock('../sheets/settings.sheet', () => ({ getAllSettings: vi.fn() }));
vi.mock('../sheets/meta.sheet', () => ({ readNextRevision: vi.fn() }));

import { getTasksByRevision } from '../sheets/tasks.sheet';
import { getGoalsByRevision } from '../sheets/goals.sheet';
import { getContextsByRevision } from '../sheets/contexts.sheet';
import { getCategoriesByRevision } from '../sheets/categories.sheet';
import { getChecklistItemsByRevision } from '../sheets/checklists.sheet';
import { getIdeasByRevision } from '../sheets/ideas.sheet';
import { getAllSettings } from '../sheets/settings.sheet';
import { readNextRevision } from '../sheets/meta.sheet';
import { parseResponse } from '../../tests/helpers/response';

describe('pull', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTasksByRevision).mockReturnValue([]);
    vi.mocked(getGoalsByRevision).mockReturnValue([]);
    vi.mocked(getContextsByRevision).mockReturnValue([]);
    vi.mocked(getCategoriesByRevision).mockReturnValue([]);
    vi.mocked(getChecklistItemsByRevision).mockReturnValue([]);
    vi.mocked(getIdeasByRevision).mockReturnValue([]);
    vi.mocked(getAllSettings).mockReturnValue([]);
    vi.mocked(readNextRevision).mockReturnValue(1);
  });

  it('should return ok: true on success', () => {
    pull({ since_revision: 0 });
    expect(parseResponse().ok).toBe(true);
  });

  it('should return data with all six entity arrays', () => {
    pull({ since_revision: 0 });
    const response = parseResponse();
    const data = response.data as Record<string, unknown>;
    expect(data).toHaveProperty('tasks');
    expect(data).toHaveProperty('goals');
    expect(data).toHaveProperty('contexts');
    expect(data).toHaveProperty('categories');
    expect(data).toHaveProperty('checklist_items');
    expect(data).toHaveProperty('ideas');
  });

  it('should return settings array in response', () => {
    pull({ since_revision: 0 });
    expect(parseResponse()).toHaveProperty('settings');
  });

  it('should return server_time as ISO string', () => {
    pull({ since_revision: 0 });
    const serverTime = parseResponse().server_time as string;
    expect(() => new Date(serverTime).toISOString()).not.toThrow();
    expect(serverTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should pass since_revision to getTasksByRevision', () => {
    pull({ since_revision: 42 });
    expect(getTasksByRevision).toHaveBeenCalledWith(42);
  });

  it('should pass since_revision to getGoalsByRevision', () => {
    pull({ since_revision: 10 });
    expect(getGoalsByRevision).toHaveBeenCalledWith(10);
  });

  it('should pass since_revision to getContextsByRevision', () => {
    pull({ since_revision: 5 });
    expect(getContextsByRevision).toHaveBeenCalledWith(5);
  });

  it('should pass since_revision to getCategoriesByRevision', () => {
    pull({ since_revision: 3 });
    expect(getCategoriesByRevision).toHaveBeenCalledWith(3);
  });

  it('should pass since_revision to getChecklistItemsByRevision', () => {
    pull({ since_revision: 20 });
    expect(getChecklistItemsByRevision).toHaveBeenCalledWith(20);
  });

  it('should pass since_revision to getIdeasByRevision', () => {
    pull({ since_revision: 15 });
    expect(getIdeasByRevision).toHaveBeenCalledWith(15);
  });

  it('should use 0 as default when since_revision is undefined', () => {
    pull({} as never);
    expect(getTasksByRevision).toHaveBeenCalledWith(0);
  });

  it('should return current_revision as next_revision minus 1', () => {
    vi.mocked(readNextRevision).mockReturnValue(8);
    pull({ since_revision: 0 });
    expect(parseResponse().current_revision).toBe(7);
  });

  it('should return current_revision = 0 when next_revision is 1 (nothing pushed yet)', () => {
    vi.mocked(readNextRevision).mockReturnValue(1);
    pull({ since_revision: 0 });
    expect(parseResponse().current_revision).toBe(0);
  });

  it('should return entity records returned by sheet functions', () => {
    const mockTask = { id: 'task-1', revision: 5 } as never;
    vi.mocked(getTasksByRevision).mockReturnValue([mockTask]);

    pull({ since_revision: 0 });

    const data = parseResponse().data as Record<string, unknown>;
    expect(data.tasks).toEqual([mockTask]);
  });

  it('should return settings returned by getAllSettings', () => {
    const mockSettings = [{ key: 'default_box', value: 'inbox', updated_at: '2025-01-01T00:00:00.000Z' }];
    vi.mocked(getAllSettings).mockReturnValue(mockSettings);

    pull({ since_revision: 0 });

    expect(parseResponse().settings).toEqual(mockSettings);
  });

  it('should return NOT_INITIALIZED error when sheet throws with NOT_INITIALIZED message', () => {
    vi.mocked(getTasksByRevision).mockImplementation(() => {
      throw new Error(ERROR_CODES.NOT_INITIALIZED);
    });

    pull({ since_revision: 0 });

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.NOT_INITIALIZED);
  });

  it('should return INTERNAL_ERROR when sheet throws an unexpected error', () => {
    vi.mocked(getGoalsByRevision).mockImplementation(() => {
      throw new Error('Something went wrong');
    });

    pull({ since_revision: 0 });

    const response = parseResponse();
    expect(response.ok).toBe(false);
    expect(response.error).toBe(ERROR_CODES.INTERNAL_ERROR);
  });

  it('should include the original error message in INTERNAL_ERROR response', () => {
    const originalMessage = 'Unexpected sheet error';
    vi.mocked(getContextsByRevision).mockImplementation(() => {
      throw new Error(originalMessage);
    });

    pull({ since_revision: 0 });

    expect(parseResponse().message).toBe(originalMessage);
  });
});
