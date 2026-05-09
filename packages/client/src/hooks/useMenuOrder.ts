import { useSyncExternalStore } from "react";
import { getSnapshot, setMenuOrder, subscribe } from "@/stores/menuOrderStore";

export function useMenuOrder() {
  const menuOrder = useSyncExternalStore(subscribe, getSnapshot);
  return { menuOrder, setMenuOrder };
}
