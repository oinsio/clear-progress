import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pull } from './pull';
import { ERROR_CODES } from '../helpers/response';
import { parseResponse, expectErrorResponse, expectSuccessResponse, createMockEntityWithRevision, expectPullResponseStructure, expectValidServerTime, getResponseData } from '../../tests/helpers';

vi.mock('../sheets/tasks.sheet');
vi.mock('../sheets/goals.sheet');
vi.mock('../sheets/contexts.sheet');
vi.mock('../sheets/categories.sheet');
vi.mock('../sheets/checklists.sheet');
vi.mock('../sheets/ideas.sheet');
vi.mock('../sheets/settings.sheet');
vi.mock('../sheets/meta.sheet');

import { getTasksByRevision } from '../sheets/tasks.sheet';
import { getGoalsByRevision } from '../sheets/goals.sheet';
import { getContextsByRevision } from '../sheets/contexts.sheet';
import { getCategoriesByRevision } from '../sheets/categories.sheet';
import { getChecklistItemsByRevision } from '../sheets/checklists.sheet';
import { getIdeasByRevision } from '../sheets/ideas.sheet';
import { getAllSettings, getSettingsChangedSince } from '../sheets/settings.sheet';
import { readNextRevision, readPurgeRevision } from '../sheets/meta.sheet';

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
    vi.mocked(getSettingsChangedSince).mockReturnValue([]);
    vi.mocked(readNextRevision).mockReturnValue(1);
    vi.mocked(readPurgeRevision).mockReturnValue(0);
  });

  it('should return ok: true on success', () => {
    pull({ since_revision: 0 });
    expectSuccessResponse();
  });

  it('should return data with all six entity arrays', () => {
    pull({ since_revision: 0 });
    expectPullResponseStructure();
  });

  it('should return settings array in response', () => {
    pull({ since_revision: 0 });
    expect(parseResponse()).toHaveProperty('settings');
  });

  it('should return server_time as ISO string', () => {
    pull({ since_revision: 0 });
    expectValidServerTime();
  });

  it.each([
    { fn: getTasksByRevision, name: 'getTasksByRevision', revision: 42 },
    { fn: getGoalsByRevision, name: 'getGoalsByRevision', revision: 10 },
    { fn: getContextsByRevision, name: 'getContextsByRevision', revision: 5 },
    { fn: getCategoriesByRevision, name: 'getCategoriesByRevision', revision: 3 },
    { fn: getChecklistItemsByRevision, name: 'getChecklistItemsByRevision', revision: 20 },
    { fn: getIdeasByRevision, name: 'getIdeasByRevision', revision: 15 },
  ])('should pass since_revision to $name', ({ fn, revision }) => {
    pull({ since_revision: revision });
    expect(fn).toHaveBeenCalledWith(revision);
  });

  it('should use 0 as default when since_revision is undefined', () => {
    pull({} as never);
    expect(getTasksByRevision).toHaveBeenCalledWith(0);
  });

  it.each([
    { nextRevision: 8, expected: 7, description: 'next_revision minus 1' },
    { nextRevision: 1, expected: 0, description: '0 when next_revision is 1 (nothing pushed yet)' },
  ])('should return current_revision as $description', ({ nextRevision, expected }) => {
    vi.mocked(readNextRevision).mockReturnValue(nextRevision);
    pull({ since_revision: 0 });
    expect(parseResponse().current_revision).toBe(expected);
  });

  it('should return entity records returned by sheet functions', () => {
    const mockTask = createMockEntityWithRevision('task-1', 5);
    vi.mocked(getTasksByRevision).mockReturnValue([mockTask]);

    pull({ since_revision: 0 });

    const data = getResponseData();
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
    expectErrorResponse(ERROR_CODES.NOT_INITIALIZED);
  });

  it('should return INTERNAL_ERROR when sheet throws an unexpected error', () => {
    vi.mocked(getGoalsByRevision).mockImplementation(() => {
      throw new Error('Something went wrong');
    });

    pull({ since_revision: 0 });
    expectErrorResponse(ERROR_CODES.INTERNAL_ERROR);
  });

  it('should include the original error message in INTERNAL_ERROR response', () => {
    const originalMessage = 'Unexpected sheet error';
    vi.mocked(getContextsByRevision).mockImplementation(() => {
      throw new Error(originalMessage);
    });

    pull({ since_revision: 0 });

    expect(parseResponse().message).toBe(originalMessage);
  });

  describe('settings_updated_at parameter', () => {
    it('should call getAllSettings when settings_updated_at is not provided', () => {
      pull({ since_revision: 0 });

      expect(getAllSettings).toHaveBeenCalledTimes(1);
      expect(getSettingsChangedSince).not.toHaveBeenCalled();
    });

    it('should call getSettingsChangedSince when settings_updated_at is provided', () => {
      pull({ since_revision: 0, settings_updated_at: '2026-04-15T10:00:00.000Z' });

      expect(getSettingsChangedSince).toHaveBeenCalledWith('2026-04-15T10:00:00.000Z');
      expect(getAllSettings).not.toHaveBeenCalled();
    });

    it('should return all settings when settings_updated_at is not provided', () => {
      const allSettings = [
        { key: 'default_box', value: 'inbox', updated_at: '2026-04-10T00:00:00.000Z' },
        { key: 'accent_color', value: 'green', updated_at: '2026-04-15T00:00:00.000Z' },
      ];
      vi.mocked(getAllSettings).mockReturnValue(allSettings);

      pull({ since_revision: 0 });

      expect(parseResponse().settings).toEqual(allSettings);
    });

    it('should return only changed settings when settings_updated_at is provided', () => {
      const changedSettings = [
        { key: 'accent_color', value: 'blue', updated_at: '2026-04-16T00:00:00.000Z' },
      ];
      vi.mocked(getSettingsChangedSince).mockReturnValue(changedSettings);

      pull({ since_revision: 0, settings_updated_at: '2026-04-15T10:00:00.000Z' });

      expect(parseResponse().settings).toEqual(changedSettings);
    });

    it('should return empty settings array when no settings changed since given time', () => {
      vi.mocked(getSettingsChangedSince).mockReturnValue([]);

      pull({ since_revision: 0, settings_updated_at: '2026-04-15T10:00:00.000Z' });

      expect(parseResponse().settings).toEqual([]);
    });
  });
});
