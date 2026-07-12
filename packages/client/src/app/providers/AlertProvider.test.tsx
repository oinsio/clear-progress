import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { describe, expect, it } from "vitest";
import type { AppAlert } from "@/types/alerts";
import { AlertProvider, useAlerts } from "./AlertProvider";

function createWrapper() {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AlertProvider>{children}</AlertProvider>;
  };
}

const syncAlert: AppAlert = {
  type: "sync",
  messageKey: "sync.alert.repeat_rule_reset",
};
const repeatAlert: AppAlert = {
  type: "repeat_rule_invalid",
  taskNames: ["Task A"],
};

describe("AlertProvider", () => {
  it("should start with empty alerts queue", () => {
    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.alerts).toEqual([]);
  });

  it("should add alerts to empty queue in order", () => {
    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.addAlerts([syncAlert, repeatAlert]));

    expect(result.current.alerts).toEqual([syncAlert, repeatAlert]);
  });

  it("should sort alerts by priority when adding to existing queue", () => {
    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.addAlerts([repeatAlert]));
    act(() => result.current.addAlerts([syncAlert]));

    expect(result.current.alerts[0]).toEqual(syncAlert);
    expect(result.current.alerts[1]).toEqual(repeatAlert);
  });

  it("should display sync alerts before repeat_rule_invalid alerts", () => {
    const secondRepeatAlert: AppAlert = {
      type: "repeat_rule_invalid",
      taskNames: ["Task B"],
    };
    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    act(() =>
      result.current.addAlerts([repeatAlert, secondRepeatAlert, syncAlert]),
    );

    expect(result.current.alerts[0].type).toBe("sync");
    expect(result.current.alerts[1].type).toBe("repeat_rule_invalid");
    expect(result.current.alerts[2].type).toBe("repeat_rule_invalid");
  });

  it("should maintain insertion order within same alert type", () => {
    const syncAlert2: AppAlert = {
      type: "sync",
      messageKey: "sync.alert.name_set_untitled",
    };
    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.addAlerts([syncAlert, syncAlert2]));

    expect(result.current.alerts).toEqual([syncAlert, syncAlert2]);
  });

  it("should clear all alerts on dismissAlerts", () => {
    const { result } = renderHook(() => useAlerts(), {
      wrapper: createWrapper(),
    });

    act(() => result.current.addAlerts([syncAlert, repeatAlert]));
    act(() => result.current.dismissAlerts());

    expect(result.current.alerts).toEqual([]);
  });

  it("should return fallback when useAlerts is used outside AlertProvider", () => {
    const { result } = renderHook(() => useAlerts());
    expect(result.current.alerts).toEqual([]);
  });
});
