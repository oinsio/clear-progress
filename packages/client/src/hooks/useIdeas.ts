import { liveQuery } from "dexie";
import { useCallback, useEffect, useState } from "react";
import { useSync } from "@/app/providers/SyncProvider";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { IdeaService } from "@/services/IdeaService";
import type { Idea } from "@/types/entities";

const defaultIdeaService = new IdeaService(
  new IdeaRepository(),
  new AttachmentRepository(),
);

export interface UseIdeasReturn {
  ideas: Idea[];
  isLoading: boolean;
  reloadIdeas: () => Promise<void>;
  createIdea: (data: Pick<Idea, "name"> & Partial<Idea>) => Promise<void>;
  updateIdea: (id: string, changes: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  reorderIdeas: (orderedIdeas: Idea[]) => Promise<void>;
}

export function useIdeas(
  ideaService: IdeaService = defaultIdeaService,
): UseIdeasReturn {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush } = useSync();

  useEffect(() => {
    setIsLoading(true);
    const subscription = liveQuery(() => ideaService.getAll()).subscribe({
      next: (allIdeas) => {
        setIdeas(allIdeas);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [ideaService]);

  const createIdea = useCallback(
    async (data: Pick<Idea, "name"> & Partial<Idea>) => {
      await ideaService.create(data);
      schedulePush();
    },
    [ideaService, schedulePush],
  );

  const updateIdea = useCallback(
    async (id: string, changes: Partial<Idea>) => {
      await ideaService.update(id, changes);
      schedulePush();
    },
    [ideaService, schedulePush],
  );

  const deleteIdea = useCallback(
    async (id: string) => {
      await ideaService.softDelete(id);
      schedulePush();
    },
    [ideaService, schedulePush],
  );

  const reorderIdeas = useCallback(
    async (orderedIdeas: Idea[]) => {
      await ideaService.reorderIdeas(orderedIdeas);
      schedulePush();
    },
    [ideaService, schedulePush],
  );

  const reloadIdeas = useCallback(async () => {
    // liveQuery handles reactive updates automatically
  }, []);

  return {
    ideas,
    isLoading,
    reloadIdeas,
    createIdea,
    updateIdea,
    deleteIdea,
    reorderIdeas,
  };
}
