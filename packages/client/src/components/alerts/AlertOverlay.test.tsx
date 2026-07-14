// Implements FR6, FR7 of detect-invalid-repeat-rule
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AlertProvider, useAlerts } from "@/app/providers/AlertProvider";
import type { AppAlert } from "@/types/alerts";
import { AlertOverlay } from "./AlertOverlay";

const { mockReactI18next } = await vi.hoisted(
  () => import("@/test/helpers/mockReactI18next"),
);
vi.mock("react-i18next", () => mockReactI18next());

const SYNC_ALERT: AppAlert = {
  type: "sync",
  messageKey: "sync.alert.repeat_rule_reset",
};

const SYNC_ALERT_2: AppAlert = {
  type: "sync",
  messageKey: "sync.alert.name_set_untitled",
};

const REPEAT_ALERT: AppAlert = {
  type: "repeat_rule_invalid",
  taskNames: ["Buy groceries", "Water plants"],
};

/**
 * Helper that renders AlertOverlay within AlertProvider,
 * then adds alerts via a setter component.
 */
let addAlertsFn: (alerts: AppAlert[]) => void;

function AlertSetter() {
  const { addAlerts } = useAlerts();
  addAlertsFn = addAlerts;
  return null;
}

function renderOverlay() {
  return render(
    <AlertProvider>
      <AlertSetter />
      <AlertOverlay />
    </AlertProvider>,
  );
}

function renderWithAlerts(alerts: AppAlert[]) {
  renderOverlay();
  act(() => addAlertsFn(alerts));
}

describe("AlertOverlay", () => {
  afterEach(() => {
    cleanup();
  });

  describe("no alerts", () => {
    it("should return null when there are no alerts", () => {
      renderOverlay();
      expect(screen.queryByTestId("alert-overlay")).not.toBeInTheDocument();
    });
  });

  describe("single alert", () => {
    it("should render overlay when there is one alert", () => {
      renderWithAlerts([SYNC_ALERT]);
      expect(screen.getByTestId("alert-overlay")).toBeInTheDocument();
    });

    it("should show counter 1/1 for single alert", () => {
      renderWithAlerts([SYNC_ALERT]);
      expect(screen.getByTestId("alert-counter")).toHaveTextContent("1/1");
    });

    it("should show Understood button for single alert", () => {
      renderWithAlerts([SYNC_ALERT]);
      expect(screen.getByTestId("alert-understood")).toBeInTheDocument();
    });

    it("should not show Back button for single alert", () => {
      renderWithAlerts([SYNC_ALERT]);
      expect(screen.queryByTestId("alert-back")).not.toBeInTheDocument();
    });

    it("should not show Next button for single alert", () => {
      renderWithAlerts([SYNC_ALERT]);
      expect(screen.queryByTestId("alert-next")).not.toBeInTheDocument();
    });
  });

  describe("first of two alerts", () => {
    it("should show counter 1/2", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      expect(screen.getByTestId("alert-counter")).toHaveTextContent("1/2");
    });

    it("should show Next button", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      expect(screen.getByTestId("alert-next")).toBeInTheDocument();
    });

    it("should not show Back button on first alert", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      expect(screen.queryByTestId("alert-back")).not.toBeInTheDocument();
    });

    it("should not show Understood button on first of two", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      expect(screen.queryByTestId("alert-understood")).not.toBeInTheDocument();
    });
  });

  describe("last of two alerts", () => {
    it("should show counter 2/2 after navigating Next", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      fireEvent.click(screen.getByTestId("alert-next"));
      expect(screen.getByTestId("alert-counter")).toHaveTextContent("2/2");
    });

    it("should show Back button on last alert", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      fireEvent.click(screen.getByTestId("alert-next"));
      expect(screen.getByTestId("alert-back")).toBeInTheDocument();
    });

    it("should show Understood button on last alert", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      fireEvent.click(screen.getByTestId("alert-next"));
      expect(screen.getByTestId("alert-understood")).toBeInTheDocument();
    });

    it("should not show Next button on last alert", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      fireEvent.click(screen.getByTestId("alert-next"));
      expect(screen.queryByTestId("alert-next")).not.toBeInTheDocument();
    });
  });

  describe("middle of three alerts", () => {
    it("should show counter 2/3 on middle alert", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2, REPEAT_ALERT]);
      fireEvent.click(screen.getByTestId("alert-next"));
      expect(screen.getByTestId("alert-counter")).toHaveTextContent("2/3");
    });

    it("should show Back and Next on middle alert", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2, REPEAT_ALERT]);
      fireEvent.click(screen.getByTestId("alert-next"));
      expect(screen.getByTestId("alert-back")).toBeInTheDocument();
      expect(screen.getByTestId("alert-next")).toBeInTheDocument();
    });

    it("should not show Understood on middle alert", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2, REPEAT_ALERT]);
      fireEvent.click(screen.getByTestId("alert-next"));
      expect(screen.queryByTestId("alert-understood")).not.toBeInTheDocument();
    });
  });

  describe("navigation behavior", () => {
    it("should advance to next alert on Next click", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      fireEvent.click(screen.getByTestId("alert-next"));
      expect(screen.getByTestId("alert-counter")).toHaveTextContent("2/2");
    });

    it("should return to previous alert on Back click", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      fireEvent.click(screen.getByTestId("alert-next"));
      fireEvent.click(screen.getByTestId("alert-back"));
      expect(screen.getByTestId("alert-counter")).toHaveTextContent("1/2");
    });

    it("should dismiss all alerts on Understood click", () => {
      renderWithAlerts([SYNC_ALERT]);
      fireEvent.click(screen.getByTestId("alert-understood"));
      expect(screen.queryByTestId("alert-overlay")).not.toBeInTheDocument();
    });

    it("should dismiss all alerts from last of multiple", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      fireEvent.click(screen.getByTestId("alert-next"));
      fireEvent.click(screen.getByTestId("alert-understood"));
      expect(screen.queryByTestId("alert-overlay")).not.toBeInTheDocument();
    });
  });

  describe("Escape key", () => {
    it("should dismiss all alerts on Escape", () => {
      renderWithAlerts([SYNC_ALERT]);
      fireEvent.keyDown(screen.getByTestId("alert-overlay"), {
        key: "Escape",
      });
      expect(screen.queryByTestId("alert-overlay")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have role alertdialog and aria-modal true", () => {
      renderWithAlerts([SYNC_ALERT]);
      const overlay = screen.getByTestId("alert-overlay");
      expect(overlay).toHaveAttribute("role", "alertdialog");
      expect(overlay).toHaveAttribute("aria-modal", "true");
    });

    it("should have aria-labelledby referencing title", () => {
      renderWithAlerts([SYNC_ALERT]);
      const overlay = screen.getByTestId("alert-overlay");
      const title = screen.getByTestId("alert-title");
      const labelledBy = overlay.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      expect(title.id).toBe(labelledBy);
    });

    it("should have aria-describedby referencing message", () => {
      renderWithAlerts([SYNC_ALERT]);
      const overlay = screen.getByTestId("alert-overlay");
      const message = screen.getByTestId("alert-message");
      const describedBy = overlay.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      expect(message.id).toBe(describedBy);
    });

    it("should have descriptive aria-label on Next button", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      const nextButton = screen.getByTestId("alert-next");
      expect(nextButton).toHaveAttribute(
        "aria-label",
        "Alert 1 of 2, go to next",
      );
    });

    it("should have descriptive aria-label on Back button", () => {
      renderWithAlerts([SYNC_ALERT, SYNC_ALERT_2]);
      fireEvent.click(screen.getByTestId("alert-next"));
      const backButton = screen.getByTestId("alert-back");
      expect(backButton).toHaveAttribute(
        "aria-label",
        "Alert 2 of 2, go to previous",
      );
    });

    it("should have descriptive aria-label on Understood button", () => {
      renderWithAlerts([SYNC_ALERT]);
      const understoodButton = screen.getByTestId("alert-understood");
      expect(understoodButton).toHaveAttribute(
        "aria-label",
        "Alert 1 of 1, dismiss all",
      );
    });
  });

  describe("type-specific rendering", () => {
    it("should render sync alert title for sync type", () => {
      renderWithAlerts([SYNC_ALERT]);
      const title = screen.getByTestId("alert-title");
      expect(title).toHaveTextContent("sync.alertTitle");
    });

    it("should render sync alert message for sync type", () => {
      renderWithAlerts([SYNC_ALERT]);
      const message = screen.getByTestId("alert-message");
      expect(message).toHaveTextContent("sync.alert.repeat_rule_reset");
    });

    it("should render title for repeat_rule_invalid type", () => {
      renderWithAlerts([REPEAT_ALERT]);
      const title = screen.getByTestId("alert-title");
      expect(title).toHaveTextContent("repeat.invalidRuleAlertTitle");
    });

    it("should render problem message for repeat_rule_invalid type", () => {
      renderWithAlerts([REPEAT_ALERT]);
      const message = screen.getByTestId("alert-message");
      expect(message).toHaveTextContent("repeat.invalidRuleAlertMessage");
    });

    it("should render fix instructions for repeat_rule_invalid type", () => {
      renderWithAlerts([REPEAT_ALERT]);
      expect(
        screen.getByText("repeat.invalidRuleAlertFix"),
      ).toBeInTheDocument();
    });

    it("should render task names in list for repeat_rule_invalid type", () => {
      renderWithAlerts([REPEAT_ALERT]);
      const taskList = screen.getByTestId("repeat-rule-invalid-task-list");
      expect(taskList).toBeInTheDocument();
      expect(taskList).toHaveTextContent("Buy groceries");
      expect(taskList).toHaveTextContent("Water plants");
    });

    it("should have scrollable task list for repeat_rule_invalid type", () => {
      renderWithAlerts([REPEAT_ALERT]);
      const taskList = screen.getByTestId("repeat-rule-invalid-task-list");
      expect(taskList.className).toContain("max-h-32");
      expect(taskList.className).toContain("overflow-y-auto");
    });
  });
});
