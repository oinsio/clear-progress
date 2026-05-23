import { beforeEach } from "vitest";
import { db } from "../database";
import { ChecklistRepository } from "./ChecklistRepository";

export function createChecklistRepositorySetup(): {
  getRepository: () => ChecklistRepository;
} {
  let checklistRepository: ChecklistRepository;

  beforeEach(async () => {
    await db.checklist_items.clear();
    checklistRepository = new ChecklistRepository();
  });

  return {
    getRepository: () => checklistRepository,
  };
}
