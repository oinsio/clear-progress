// implements NFR-REL1 of fix-stale-sync-overwrites
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { ServerCallCredentials } from "./server-api.js";
import { pullFromServer } from "./server-api.js";

/** Dexie database name — must match `DB_NAME` in packages/client/src/constants/index.ts. */
const DEXIE_DB_NAME = "clear-progress";

/** Entity table keys this helper knows how to dump, mapped to their Dexie store name. */
const ENTITY_TABLE_NAMES = {
  tasks: "tasks",
  goals: "goals",
  contexts: "contexts",
  categories: "categories",
  checklist_items: "checklist_items",
  ideas: "ideas",
} as const;

/** Entity key accepted by the convergence helpers (extensible to all synced tables). */
export type ConvergenceEntityKey = keyof typeof ENTITY_TABLE_NAMES;

/** Pull response entity array key matching each `ConvergenceEntityKey` (server payload uses the same name). */
const SERVER_ENTITY_KEYS = ENTITY_TABLE_NAMES;

/**
 * Client-only bookkeeping fields that never appear in the server record and
 * must be stripped before comparing a device snapshot against the server.
 */
const CLIENT_ONLY_FIELDS = ["syncStatus"] as const;

/** A single entity record read from either an IndexedDB store or the server. */
type EntityRecord = Record<string, unknown>;

/**
 * Reads every record from a single Dexie object store on the given page,
 * via the raw IndexedDB API (no app code involved, works regardless of
 * whether the app's Dexie instance is currently open in that page).
 */
async function dumpIndexedDbStore(
  testPage: Page,
  storeName: string,
): Promise<EntityRecord[]> {
  return testPage.evaluate(
    ({ dbName, store }) => {
      return new Promise<EntityRecord[]>((resolve, reject) => {
        const request = indexedDB.open(dbName);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(store)) {
            database.close();
            resolve([]);
            return;
          }
          const transaction = database.transaction(store, "readonly");
          const getAllRequest = transaction.objectStore(store).getAll();
          getAllRequest.onsuccess = () => {
            database.close();
            resolve(getAllRequest.result as EntityRecord[]);
          };
          getAllRequest.onerror = () => {
            database.close();
            reject(getAllRequest.error);
          };
        };
      });
    },
    { dbName: DEXIE_DB_NAME, store: storeName },
  );
}

/** Strips client-only fields so a device snapshot is comparable to a server snapshot. */
function stripClientOnlyFields(record: EntityRecord): EntityRecord {
  const normalized = { ...record };
  for (const field of CLIENT_ONLY_FIELDS) {
    delete normalized[field];
  }
  return normalized;
}

/** Sorts records by `id` so array order never causes a spurious diff. */
function sortById(records: EntityRecord[]): EntityRecord[] {
  return [...records].sort((a, b) =>
    String(a.id ?? "").localeCompare(String(b.id ?? "")),
  );
}

/**
 * Dumps one entity table from a device's IndexedDB, normalized for
 * comparison: client-only fields stripped, sorted by `id`.
 * Implements NFR-REL1 of fix-stale-sync-overwrites.
 */
export async function dumpDeviceState(
  testPage: Page,
  entityKey: ConvergenceEntityKey,
): Promise<EntityRecord[]> {
  const records = await dumpIndexedDbStore(
    testPage,
    ENTITY_TABLE_NAMES[entityKey],
  );
  return sortById(records.map(stripClientOnlyFields));
}

/**
 * Dumps one entity table from the server via the pull endpoint, normalized
 * the same way as `dumpDeviceState` so the two are directly comparable.
 * Implements NFR-REL1 of fix-stale-sync-overwrites.
 */
export async function dumpServerState(
  credentials: ServerCallCredentials,
  entityKey: ConvergenceEntityKey,
): Promise<EntityRecord[]> {
  const pullResponse =
    await pullFromServer<Record<ConvergenceEntityKey, EntityRecord[]>>(
      credentials,
    );
  const records = pullResponse[SERVER_ENTITY_KEYS[entityKey]] ?? [];
  return sortById(records.map(stripClientOnlyFields));
}

/**
 * Asserts that device A, device B, and the server all hold an identical set
 * of records for the given entity table — the NFR-REL1 convergence check.
 * Call after both devices have completed a push+pull cycle.
 * Implements NFR-REL1 of fix-stale-sync-overwrites.
 */
export async function assertConverged(
  pageA: Page,
  pageB: Page,
  credentials: ServerCallCredentials,
  entityKey: ConvergenceEntityKey,
): Promise<void> {
  const [deviceAState, deviceBState, serverState] = await Promise.all([
    dumpDeviceState(pageA, entityKey),
    dumpDeviceState(pageB, entityKey),
    dumpServerState(credentials, entityKey),
  ]);

  expect(deviceAState).toEqual(serverState);
  expect(deviceBState).toEqual(serverState);
}
