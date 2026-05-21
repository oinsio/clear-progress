// implements FR15 of add-supabase-integration-tests
import { expect, test } from "@playwright/test";
import { createTask, openTaskDetail, updateTaskName } from "../page-actions.js";
import {
  pullFromServer,
  setupTwoDeviceTest,
  triggerSyncAndWait,
} from "../test-helpers.js";

const { getPageA, getPageB, getCredentials } = setupTwoDeviceTest();

// State carried between sequential tests (5.14.1 -> 5.14.2)
let dirtyNameB: string;

interface DirtyProtectionPullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    is_deleted: boolean;
    is_completed: boolean;
    updated_at: string;
  }>;
}

// ---------------------------------------------------------------------------
// 5.14.1 — App B has dirty record -> App A pushes update -> App B pulls ->
//           dirty record NOT overwritten
// ---------------------------------------------------------------------------
test("App B dirty record is preserved when App A pushes update and App B pulls", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  // Setup: A creates task, both sync
  const taskName = `Dirty Protection Task ${Date.now()}`;
  await createTask(pageA, taskName);
  await triggerSyncAndWait(pageA);
  await triggerSyncAndWait(pageB);

  // Verify task is visible on pageB before proceeding — sync completed
  // but React re-render + IndexedDB read may need a moment.
  await pageB
    .locator('[data-testid="task-item-name"]', { hasText: taskName })
    .waitFor({ state: "visible", timeout: 10_000 });

  // A modifies same task and pushes FIRST
  const nameFromA = `Updated by A ${Date.now()}`;
  await pageA.goto("/tasks");
  await pageA.waitForSelector('[data-testid="inbox-page"]');
  await openTaskDetail(pageA, taskName);
  await updateTaskName(pageA, nameFromA);
  await triggerSyncAndWait(pageA);

  // B modifies task locally AFTER A pushed (B's updated_at will be newer)
  // B still sees the original name because it hasn't pulled A's changes.
  // IMPORTANT: do NOT navigate pageB here — pageB is already on /tasks
  // after the sync at line 85. A fresh goto("/tasks") would trigger auto-sync,
  // which would pull A's update and overwrite the original name before B can edit.
  dirtyNameB = `Dirty by B ${Date.now()}`;
  await openTaskDetail(pageB, taskName);
  await updateTaskName(pageB, dirtyNameB);
  // B now has dirty record with newer updated_at but hasn't synced

  // B syncs — push sends B's dirty record (newer updated_at → ACCEPTED),
  // then pull gets current state. B's version should win.
  await triggerSyncAndWait(pageB);

  // Verify: B's UI shows dirtyNameB (B's newer modification was accepted)
  await pageB.goto("/tasks");
  await pageB.waitForSelector('[data-testid="inbox-page"]');
  const taskItemB = pageB.locator('[data-testid="task-item"]').filter({
    has: pageB.locator('[data-testid="task-item-name"]', {
      hasText: dirtyNameB,
    }),
  });
  await expect(taskItemB).toBeVisible();

  // Server also has B's version (B's push was accepted as it had newer updated_at)
  const serverPull = await pullFromServer<DirtyProtectionPullResponse>(
    getCredentials(),
  );
  const serverTask = serverPull.tasks.find((task) => task.name === dirtyNameB);
  expect(serverTask).toBeDefined();
});

// ---------------------------------------------------------------------------
// 5.14.2 — App B pushes dirty -> then pulls -> record now synced,
//           next pull can overwrite
// ---------------------------------------------------------------------------
test("App B pushes dirty record -> server gets B version -> record synced", async () => {
  // B pushes its dirty record to server
  await triggerSyncAndWait(getPageB());

  // Verify: server now has B's version
  const pullAfterBPush = await pullFromServer<DirtyProtectionPullResponse>(
    getCredentials(),
  );
  const syncedTask = pullAfterBPush.tasks.find(
    (task) => task.name === dirtyNameB,
  );
  expect(syncedTask).toBeDefined();
});

// ---------------------------------------------------------------------------
// 5.14.3 — App B has unpushed new task -> App A pushes different task ->
//           App B pulls -> gets A's task without losing own
// ---------------------------------------------------------------------------
test("App B unpushed new task survives pull that brings A's new task", async () => {
  const pageA = getPageA();
  const pageB = getPageB();
  const taskByB = `Unpushed B Task ${Date.now()}`;
  const taskByA = `Pushed A Task ${Date.now()}`;

  // A creates task and pushes FIRST — ensure it's on the server
  // before B creates its local task (avoids B's debounced sync
  // pulling from server before A's task is available).
  await pageA.goto("/tasks");
  await pageA.waitForSelector('[data-testid="inbox-page"]');
  await createTask(pageA, taskByA);
  await triggerSyncAndWait(pageA);

  // B creates task locally AFTER A's task is on the server.
  // pageB is already on /tasks — avoid goto which triggers auto-sync race.
  await createTask(pageB, taskByB);
  // B does NOT sync explicitly

  // B syncs — should push its own task and pull A's task
  await triggerSyncAndWait(pageB);

  // Verify B has both tasks (pageB is already on /tasks after sync)
  const bOwnTask = pageB.locator('[data-testid="task-item-name"]', {
    hasText: taskByB,
  });
  const aReceivedTask = pageB.locator('[data-testid="task-item-name"]', {
    hasText: taskByA,
  });
  await expect(bOwnTask).toBeVisible();
  await expect(aReceivedTask).toBeVisible();
});
