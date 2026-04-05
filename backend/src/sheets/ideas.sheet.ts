import { SHEET_NAMES, colMap } from '../helpers/constants';
import { getAllRecords, upsertRecords, deleteRecordsByIds, rowToNamedEntity } from './base';
import type { Idea } from '../types';

const COLS = colMap(SHEET_NAMES.IDEAS);

const rowToIdea = (row: unknown[]): Idea => ({
  ...rowToNamedEntity(row, COLS),
  description: String(row[COLS.description] ?? ''),
});

export const getAllIdeas = (): Idea[] => getAllRecords(SHEET_NAMES.IDEAS, rowToIdea);
export const getIdeasByRevision = (sinceRevision: number): Idea[] =>
  getAllIdeas().filter(idea => idea.revision === 0 || idea.revision > sinceRevision);
export const upsertIdeas = (ideas: Idea[]): void => upsertRecords(SHEET_NAMES.IDEAS, ideas);
export const deleteIdeasByIds = (ids: string[]): number => deleteRecordsByIds(SHEET_NAMES.IDEAS, ids);
