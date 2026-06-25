import { db } from "@/db/database";

export async function clearAllEntityTables() {
  await db.tasks.clear();
  await db.goals.clear();
  await db.ideas.clear();
  await db.contexts.clear();
  await db.categories.clear();
  await db.checklist_items.clear();
}
