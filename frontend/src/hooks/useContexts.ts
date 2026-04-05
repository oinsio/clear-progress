import { useState, useEffect, useCallback } from "react";
import { liveQuery } from "dexie";
import type { Context } from "@/types/entities";
import { ContextService } from "@/services/ContextService";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { useSync } from "@/app/providers/SyncProvider";

const defaultContextService = new ContextService(new ContextRepository());

export interface UseContextsReturn {
  contexts: Context[];
  isLoading: boolean;
  createContext: (name: string) => Promise<void>;
  updateContext: (id: string, name: string) => Promise<void>;
  deleteContext: (id: string) => Promise<void>;
  reorderContexts: (orderedContexts: Context[]) => Promise<void>;
}

export function useContexts(
  contextService: ContextService = defaultContextService,
): UseContextsReturn {
  const [contexts, setContexts] = useState<Context[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { schedulePush } = useSync();

  useEffect(() => {
    setIsLoading(true);
    const subscription = liveQuery(() => contextService.getAll()).subscribe({
      next: (allContexts) => {
        setContexts(allContexts);
        setIsLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, [contextService]);

  const createContext = useCallback(
    async (name: string) => {
      await contextService.create(name);
      schedulePush();
    },
    [contextService, schedulePush],
  );

  const updateContext = useCallback(
    async (id: string, name: string) => {
      await contextService.update(id, name);
      schedulePush();
    },
    [contextService, schedulePush],
  );

  const deleteContext = useCallback(
    async (id: string) => {
      await contextService.softDelete(id);
      schedulePush();
    },
    [contextService, schedulePush],
  );

  const reorderContexts = useCallback(
    async (orderedContexts: Context[]) => {
      await contextService.reorderContexts(orderedContexts);
      schedulePush();
    },
    [contextService, schedulePush],
  );

  return {
    contexts,
    isLoading,
    createContext,
    updateContext,
    deleteContext,
    reorderContexts,
  };
}
