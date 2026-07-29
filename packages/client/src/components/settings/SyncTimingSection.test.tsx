// implements FR8, UX1, UX2, UX3, UX4, UX5 of configurable-sync-timing
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SyncTimingSection } from "./SyncTimingSection";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

interface RenderOptions {
  syncInterval?: number | null;
  autoSyncDelay?: number;
  onSyncIntervalChange?: (value: number | null) => Promise<void>;
  onAutoSyncDelayChange?: (value: number) => Promise<void>;
}

function renderSection(options: RenderOptions = {}) {
  const onSyncIntervalChange =
    options.onSyncIntervalChange ?? vi.fn().mockResolvedValue(undefined);
  const onAutoSyncDelayChange =
    options.onAutoSyncDelayChange ?? vi.fn().mockResolvedValue(undefined);
  const renderResult = render(
    <SyncTimingSection
      syncInterval={
        options.syncInterval === undefined ? 5 : options.syncInterval
      }
      autoSyncDelay={options.autoSyncDelay ?? 15}
      onSyncIntervalChange={onSyncIntervalChange}
      onAutoSyncDelayChange={onAutoSyncDelayChange}
    />,
  );
  return { onSyncIntervalChange, onAutoSyncDelayChange, ...renderResult };
}

function getSyncIntervalInput(): HTMLInputElement {
  return screen.getByTestId("sync-interval-input") as HTMLInputElement;
}

function getAutoSyncDelayInput(): HTMLInputElement {
  return screen.getByTestId("auto-sync-delay-input") as HTMLInputElement;
}

describe("SyncTimingSection", () => {
  describe("initial rendering", () => {
    it("should render the section container", () => {
      renderSection();
      expect(screen.getByTestId("settings-sync-timing")).toBeInTheDocument();
    });

    it("should show the current sync interval value in the interval input", () => {
      renderSection({ syncInterval: 10 });
      expect(getSyncIntervalInput().value).toBe("10");
    });

    it("should show an empty interval input when syncInterval is null", () => {
      renderSection({ syncInterval: null });
      expect(getSyncIntervalInput().value).toBe("");
    });

    it("should show an empty delay input when autoSyncDelay is 0 (immediate)", () => {
      renderSection({ autoSyncDelay: 0 });
      expect(getAutoSyncDelayInput().value).toBe("");
    });

    it("should show the current auto sync delay value in the delay input", () => {
      renderSection({ autoSyncDelay: 30 });
      expect(getAutoSyncDelayInput().value).toBe("30");
    });

    it("should render the unit suffix for the interval input", () => {
      renderSection();
      expect(screen.getByText("settings.syncIntervalUnit")).toBeInTheDocument();
    });

    it("should render the unit suffix for the delay input", () => {
      renderSection();
      expect(
        screen.getByText("settings.autoSyncDelayUnit"),
      ).toBeInTheDocument();
    });

    it("should give the interval input the id 'sync-interval'", () => {
      renderSection();
      expect(getSyncIntervalInput().id).toBe("sync-interval");
    });

    it("should give the delay input the id 'auto-sync-delay'", () => {
      renderSection();
      expect(getAutoSyncDelayInput().id).toBe("auto-sync-delay");
    });
  });

  describe("sync indicators", () => {
    it("should render a SyncIndicator for the sync_interval key", () => {
      renderSection();
      const indicators = screen.getAllByTestId("sync-indicator");
      expect(indicators).toHaveLength(2);
    });

    it("should render a SyncIndicator near each labeled input", () => {
      renderSection();
      const intervalLabel = screen.getByText("settings.syncInterval");
      const delayLabel = screen.getByText("settings.autoSyncDelay");
      expect(intervalLabel).toBeInTheDocument();
      expect(delayLabel).toBeInTheDocument();
    });
  });

  describe("committing valid values", () => {
    it("should call onSyncIntervalChange with the parsed number on blur", () => {
      const onSyncIntervalChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "20" } });
      fireEvent.blur(intervalInput);

      expect(onSyncIntervalChange).toHaveBeenCalledWith(20);
    });

    it("should call onAutoSyncDelayChange with the parsed number on Enter", () => {
      const onAutoSyncDelayChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ autoSyncDelay: 15, onAutoSyncDelayChange });

      const delayInput = getAutoSyncDelayInput();
      fireEvent.change(delayInput, { target: { value: "60" } });
      fireEvent.keyDown(delayInput, { key: "Enter" });

      expect(onAutoSyncDelayChange).toHaveBeenCalledWith(60);
    });

    it("should not call the change handler when the committed value equals the current prop", () => {
      const onSyncIntervalChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.blur(intervalInput);

      expect(onSyncIntervalChange).not.toHaveBeenCalled();
    });

    it("should not commit on a keydown other than Enter", () => {
      const onAutoSyncDelayChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ autoSyncDelay: 15, onAutoSyncDelayChange });

      const delayInput = getAutoSyncDelayInput();
      fireEvent.change(delayInput, { target: { value: "60" } });
      fireEvent.keyDown(delayInput, { key: "a" });

      expect(onAutoSyncDelayChange).not.toHaveBeenCalled();
    });

    it("should select the current text when the input receives focus", () => {
      renderSection({ syncInterval: 5 });
      const intervalInput = getSyncIntervalInput();
      const selectSpy = vi.spyOn(intervalInput, "select");

      fireEvent.focus(intervalInput);

      expect(selectSpy).toHaveBeenCalled();
    });
  });

  describe("empty input handling (UX1)", () => {
    it("should call onSyncIntervalChange with null when the interval input is cleared and committed", () => {
      const onSyncIntervalChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "" } });
      fireEvent.blur(intervalInput);

      expect(onSyncIntervalChange).toHaveBeenCalledWith(null);
    });

    it("should call onAutoSyncDelayChange with 0 when the delay input is cleared and committed", () => {
      const onAutoSyncDelayChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ autoSyncDelay: 15, onAutoSyncDelayChange });

      const delayInput = getAutoSyncDelayInput();
      fireEvent.change(delayInput, { target: { value: "" } });
      fireEvent.blur(delayInput);

      expect(onAutoSyncDelayChange).toHaveBeenCalledWith(0);
    });
  });

  describe("invalid input revert (UX1)", () => {
    it("should revert the interval input to the last valid value on blur with an out-of-range value", () => {
      const onSyncIntervalChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "99999" } });
      fireEvent.blur(intervalInput);

      expect(onSyncIntervalChange).not.toHaveBeenCalled();
      expect(getSyncIntervalInput().value).toBe("5");
    });

    it("should revert the delay input to the last valid value on blur with a non-numeric value", () => {
      const onAutoSyncDelayChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ autoSyncDelay: 15, onAutoSyncDelayChange });

      const delayInput = getAutoSyncDelayInput();
      fireEvent.change(delayInput, { target: { value: "abc" } });
      fireEvent.blur(delayInput);

      expect(onAutoSyncDelayChange).not.toHaveBeenCalled();
      expect(getAutoSyncDelayInput().value).toBe("15");
    });

    it("should revert the delay input to the last valid value when it exceeds the maximum", () => {
      const onAutoSyncDelayChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ autoSyncDelay: 15, onAutoSyncDelayChange });

      const delayInput = getAutoSyncDelayInput();
      fireEvent.change(delayInput, { target: { value: "901" } });
      fireEvent.blur(delayInput);

      expect(onAutoSyncDelayChange).not.toHaveBeenCalled();
      expect(getAutoSyncDelayInput().value).toBe("15");
    });

    it("should treat a whitespace-only interval input as cleared, not as the number zero", async () => {
      const onSyncIntervalChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "   " } });
      fireEvent.blur(intervalInput);

      await waitFor(() => {
        expect(onSyncIntervalChange).toHaveBeenCalledWith(null);
      });
    });

    it("should revert a non-integer interval value even when within range", () => {
      const onSyncIntervalChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "5.5" } });
      fireEvent.blur(intervalInput);

      expect(onSyncIntervalChange).not.toHaveBeenCalled();
      expect(getSyncIntervalInput().value).toBe("5");
    });

    it("should revert an interval value below the minimum", () => {
      const onSyncIntervalChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "0" } });
      fireEvent.blur(intervalInput);

      expect(onSyncIntervalChange).not.toHaveBeenCalled();
      expect(getSyncIntervalInput().value).toBe("5");
    });

    it("should accept the interval value at exactly the maximum boundary", () => {
      const onSyncIntervalChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "1440" } });
      fireEvent.blur(intervalInput);

      expect(onSyncIntervalChange).toHaveBeenCalledWith(1440);
    });

    it("should accept the delay value at exactly the minimum boundary", async () => {
      const onAutoSyncDelayChange = vi.fn().mockResolvedValue(undefined);
      renderSection({ autoSyncDelay: 15, onAutoSyncDelayChange });

      const delayInput = getAutoSyncDelayInput();
      fireEvent.change(delayInput, { target: { value: "0" } });
      fireEvent.blur(delayInput);

      await waitFor(() => {
        expect(onAutoSyncDelayChange).toHaveBeenCalledWith(0);
      });
    });
  });

  describe("help text (UX3)", () => {
    it("should show the disabled hint when syncInterval is null", () => {
      renderSection({ syncInterval: null });
      expect(
        screen.getByText("settings.syncIntervalDisabledHint"),
      ).toBeInTheDocument();
    });

    it("should show the interval description (not the disabled hint) when syncInterval is a normal value", () => {
      renderSection({ syncInterval: 5 });
      expect(
        screen.getByText("settings.syncIntervalDescription"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("settings.syncIntervalDisabledHint"),
      ).not.toBeInTheDocument();
    });

    it("should show the immediate hint when autoSyncDelay is 0", () => {
      renderSection({ autoSyncDelay: 0 });
      expect(
        screen.getByText("settings.autoSyncDelayImmediateHint"),
      ).toBeInTheDocument();
    });

    it("should show the delay description (not the immediate hint) when autoSyncDelay is a normal value", () => {
      renderSection({ autoSyncDelay: 15 });
      expect(
        screen.getByText("settings.autoSyncDelayDescription"),
      ).toBeInTheDocument();
      expect(
        screen.queryByText("settings.autoSyncDelayImmediateHint"),
      ).not.toBeInTheDocument();
    });
  });

  describe("write-failure revert with visible error feedback (UX5)", () => {
    it("should revert the interval input to the previous prop value when onSyncIntervalChange rejects", async () => {
      const onSyncIntervalChange = vi
        .fn()
        .mockRejectedValue(new Error("network error"));
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "20" } });
      fireEvent.blur(intervalInput);

      await waitFor(() => {
        expect(getSyncIntervalInput().value).toBe("5");
      });
    });

    it("should show a visible error indicator when onSyncIntervalChange rejects", async () => {
      const onSyncIntervalChange = vi
        .fn()
        .mockRejectedValue(new Error("network error"));
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "20" } });
      fireEvent.blur(intervalInput);

      await waitFor(() => {
        expect(
          screen.getByText("settings.syncTimingWriteError"),
        ).toBeInTheDocument();
      });
    });

    it("should revert the delay input to the previous prop value when onAutoSyncDelayChange rejects", async () => {
      const onAutoSyncDelayChange = vi
        .fn()
        .mockRejectedValue(new Error("network error"));
      renderSection({ autoSyncDelay: 15, onAutoSyncDelayChange });

      const delayInput = getAutoSyncDelayInput();
      fireEvent.change(delayInput, { target: { value: "60" } });
      fireEvent.blur(delayInput);

      await waitFor(() => {
        expect(getAutoSyncDelayInput().value).toBe("15");
      });
    });

    it("should show a visible error indicator when onAutoSyncDelayChange rejects", async () => {
      const onAutoSyncDelayChange = vi
        .fn()
        .mockRejectedValue(new Error("network error"));
      renderSection({ autoSyncDelay: 15, onAutoSyncDelayChange });

      const delayInput = getAutoSyncDelayInput();
      fireEvent.change(delayInput, { target: { value: "60" } });
      fireEvent.blur(delayInput);

      await waitFor(() => {
        expect(
          screen.getByText("settings.syncTimingWriteError"),
        ).toBeInTheDocument();
      });
    });

    it("should clear the error indicator after a subsequent successful commit", async () => {
      const onSyncIntervalChange = vi
        .fn()
        .mockRejectedValueOnce(new Error("network error"))
        .mockResolvedValueOnce(undefined);
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "20" } });
      fireEvent.blur(intervalInput);

      await waitFor(() => {
        expect(
          screen.getByText("settings.syncTimingWriteError"),
        ).toBeInTheDocument();
      });

      fireEvent.change(intervalInput, { target: { value: "30" } });
      fireEvent.blur(intervalInput);

      await waitFor(() => {
        expect(
          screen.queryByText("settings.syncTimingWriteError"),
        ).not.toBeInTheDocument();
      });
    });

    it("should clear the error indicator when re-committing the value that is already current", async () => {
      const onSyncIntervalChange = vi
        .fn()
        .mockRejectedValueOnce(new Error("network error"));
      renderSection({ syncInterval: 5, onSyncIntervalChange });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "20" } });
      fireEvent.blur(intervalInput);

      await waitFor(() => {
        expect(
          screen.getByText("settings.syncTimingWriteError"),
        ).toBeInTheDocument();
      });

      // Input reverted to "5" (the current prop) after the failed write.
      // Re-committing that same value should not attempt another write,
      // but should still clear the stale error indicator.
      fireEvent.blur(intervalInput);

      await waitFor(() => {
        expect(
          screen.queryByText("settings.syncTimingWriteError"),
        ).not.toBeInTheDocument();
      });
      expect(onSyncIntervalChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility (NFR-A1)", () => {
    it("should have an aria-label on the interval input", () => {
      renderSection();
      expect(
        screen.getByLabelText("settings.syncInterval"),
      ).toBeInTheDocument();
    });

    it("should have an aria-label on the delay input", () => {
      renderSection();
      expect(
        screen.getByLabelText("settings.autoSyncDelay"),
      ).toBeInTheDocument();
    });

    it("should have aria-describedby on the interval input pointing to its help text element", () => {
      renderSection();
      const intervalInput = getSyncIntervalInput();
      const describedById = intervalInput.getAttribute("aria-describedby");
      expect(describedById).toBeTruthy();
      expect(
        document.getElementById(describedById as string),
      ).toBeInTheDocument();
    });

    it("should have aria-describedby on the delay input pointing to its help text element", () => {
      renderSection();
      const delayInput = getAutoSyncDelayInput();
      const describedById = delayInput.getAttribute("aria-describedby");
      expect(describedById).toBeTruthy();
      expect(
        document.getElementById(describedById as string),
      ).toBeInTheDocument();
    });
  });

  describe("external prop updates (e.g. pulled from server)", () => {
    it("should re-sync the interval input when syncInterval prop changes externally", () => {
      const { rerender } = renderSection({ syncInterval: 5 });
      expect(getSyncIntervalInput().value).toBe("5");

      rerender(
        <SyncTimingSection
          syncInterval={60}
          autoSyncDelay={15}
          onSyncIntervalChange={vi.fn().mockResolvedValue(undefined)}
          onAutoSyncDelayChange={vi.fn().mockResolvedValue(undefined)}
        />,
      );

      expect(getSyncIntervalInput().value).toBe("60");
    });

    it("should re-sync the delay input when autoSyncDelay prop changes externally", () => {
      const { rerender } = renderSection({ autoSyncDelay: 15 });
      expect(getAutoSyncDelayInput().value).toBe("15");

      rerender(
        <SyncTimingSection
          syncInterval={5}
          autoSyncDelay={45}
          onSyncIntervalChange={vi.fn().mockResolvedValue(undefined)}
          onAutoSyncDelayChange={vi.fn().mockResolvedValue(undefined)}
        />,
      );

      expect(getAutoSyncDelayInput().value).toBe("45");
    });

    it("should not clobber an in-progress edit when the corresponding prop is unchanged", () => {
      const { rerender } = renderSection({
        syncInterval: 5,
        autoSyncDelay: 15,
      });

      const intervalInput = getSyncIntervalInput();
      fireEvent.change(intervalInput, { target: { value: "12" } });

      rerender(
        <SyncTimingSection
          syncInterval={5}
          autoSyncDelay={45}
          onSyncIntervalChange={vi.fn().mockResolvedValue(undefined)}
          onAutoSyncDelayChange={vi.fn().mockResolvedValue(undefined)}
        />,
      );

      expect(getSyncIntervalInput().value).toBe("12");
    });
  });
});
