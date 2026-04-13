import { useContext } from "react";
import { ShowHiddenContext } from "@/app/providers/ShowHiddenProvider";

export function useShowHidden() {
  const context = useContext(ShowHiddenContext);
  if (!context) {
    throw new Error("useShowHidden must be used within ShowHiddenProvider");
  }
  return context;
}
