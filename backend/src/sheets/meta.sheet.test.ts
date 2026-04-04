import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readNextRevision, saveNextRevision, initMetaSheet } from './meta.sheet';
import { META_KEYS, META_INITIAL_REVISION } from '../helpers/constants';

vi.mock('./client', () => ({
  getSpreadsheet: vi.fn(),
  getSheet: vi.fn(),
}));

import { getSpreadsheet, getSheet } from './client';

function makeSheetMock(rows: unknown[][] = []) {
  return {
    getDataRange: vi.fn().mockReturnValue({
      getValues: vi.fn().mockReturnValue(rows),
    }),
    getRange: vi.fn().mockReturnValue({ setValues: vi.fn() }),
    appendRow: vi.fn(),
  };
}

function makeSpreadsheetMock(existingMeta: boolean) {
  return {
    getSheetByName: vi.fn().mockReturnValue(existingMeta ? makeSheetMock() : null),
    insertSheet: vi.fn().mockReturnValue(makeSheetMock()),
  };
}

describe('readNextRevision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the stored next_revision value from Meta sheet', () => {
    const metaRows = [
      ['key', 'value'],
      [META_KEYS.NEXT_REVISION, 5],
    ];
    vi.mocked(getSheet).mockReturnValue(makeSheetMock(metaRows) as never);

    expect(readNextRevision()).toBe(5);
  });

  it('should return META_INITIAL_REVISION when next_revision row is not found', () => {
    const metaRows = [['key', 'value']];
    vi.mocked(getSheet).mockReturnValue(makeSheetMock(metaRows) as never);

    expect(readNextRevision()).toBe(META_INITIAL_REVISION);
  });

  it('should find next_revision when it is not the first data row', () => {
    const metaRows = [
      ['key', 'value'],
      ['other_key', 99],
      [META_KEYS.NEXT_REVISION, 7],
    ];
    vi.mocked(getSheet).mockReturnValue(makeSheetMock(metaRows) as never);

    expect(readNextRevision()).toBe(7);
  });

  it('should NOT return value from a non-next_revision row', () => {
    const metaRows = [
      ['key', 'value'],
      ['other_key', 999],
    ];
    vi.mocked(getSheet).mockReturnValue(makeSheetMock(metaRows) as never);

    expect(readNextRevision()).toBe(META_INITIAL_REVISION);
  });

  it('should return META_INITIAL_REVISION when sheet is empty', () => {
    vi.mocked(getSheet).mockReturnValue(makeSheetMock([]) as never);

    expect(readNextRevision()).toBe(META_INITIAL_REVISION);
  });
});

describe('saveNextRevision', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update the next_revision row when it exists', () => {
    const metaRows = [
      ['key', 'value'],
      [META_KEYS.NEXT_REVISION, 3],
    ];
    const sheetMock = makeSheetMock(metaRows);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    saveNextRevision(10);

    // rows[0]=header(sheet row 1), rows[1]=next_revision(sheet row 2) → getRange(2, ...)
    expect(sheetMock.getRange).toHaveBeenCalledWith(2, 1, 1, 2);
    const rangeInstance = sheetMock.getRange.mock.results[0].value;
    expect(rangeInstance.setValues).toHaveBeenCalledWith([[META_KEYS.NEXT_REVISION, 10]]);
  });

  it('should append a new row when next_revision row does not exist', () => {
    const sheetMock = makeSheetMock([['key', 'value']]);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    saveNextRevision(7);

    expect(sheetMock.appendRow).toHaveBeenCalledWith([META_KEYS.NEXT_REVISION, 7]);
  });

  it('should update next_revision when it is not the first data row', () => {
    const metaRows = [
      ['key', 'value'],
      ['other_key', 42],
      [META_KEYS.NEXT_REVISION, 3],
    ];
    const sheetMock = makeSheetMock(metaRows);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    saveNextRevision(15);

    // rows[2] is next_revision (sheet row 3 = i+1 where i=2)
    expect(sheetMock.getRange).toHaveBeenCalledWith(3, 1, 1, 2);
    const rangeInstance = sheetMock.getRange.mock.results[0].value;
    expect(rangeInstance.setValues).toHaveBeenCalledWith([[META_KEYS.NEXT_REVISION, 15]]);
  });

  it('should NOT update other rows when next_revision is found', () => {
    const metaRows = [
      ['key', 'value'],
      ['other_key', 42],
      [META_KEYS.NEXT_REVISION, 3],
    ];
    const sheetMock = makeSheetMock(metaRows);
    vi.mocked(getSheet).mockReturnValue(sheetMock as never);

    saveNextRevision(20);

    // Only one range update, for the correct row
    expect(sheetMock.getRange).toHaveBeenCalledTimes(1);
    expect(sheetMock.appendRow).not.toHaveBeenCalled();
  });
});

describe('initMetaSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should insert a new Meta sheet when it does not exist', () => {
    const spreadsheetMock = makeSpreadsheetMock(false);
    vi.mocked(getSpreadsheet).mockReturnValue(spreadsheetMock as never);

    initMetaSheet();

    expect(spreadsheetMock.insertSheet).toHaveBeenCalledTimes(1);
  });

  it('should set headers and initial next_revision when creating new Meta sheet', () => {
    const newSheetMock = makeSheetMock();
    const spreadsheetMock = {
      getSheetByName: vi.fn().mockReturnValue(null),
      insertSheet: vi.fn().mockReturnValue(newSheetMock),
    };
    vi.mocked(getSpreadsheet).mockReturnValue(spreadsheetMock as never);

    initMetaSheet();

    expect(newSheetMock.appendRow).toHaveBeenCalledWith(['key', 'value']);
    expect(newSheetMock.appendRow).toHaveBeenCalledWith([META_KEYS.NEXT_REVISION, META_INITIAL_REVISION]);
  });

  it('should NOT insert a sheet when Meta already exists', () => {
    const spreadsheetMock = makeSpreadsheetMock(true);
    vi.mocked(getSpreadsheet).mockReturnValue(spreadsheetMock as never);

    initMetaSheet();

    expect(spreadsheetMock.insertSheet).not.toHaveBeenCalled();
  });
});
