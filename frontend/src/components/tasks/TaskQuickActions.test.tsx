import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TaskQuickActions } from "./TaskQuickActions";
import { buildTask } from "@/test/factories/taskFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildCategory } from "@/test/factories/categoryFactory";
import { BOX } from "@/constants";

function renderQuickActions(overrides = {}) {
  const task = buildTask();
  const props = {
    task,
    goals: [],
    contexts: [],
    categories: [],
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onMove: vi.fn().mockResolvedValue(undefined),
    onOpenEdit: vi.fn(),
    ...overrides,
  };
  render(<TaskQuickActions {...props} />);
  return props;
}

describe("TaskQuickActions", () => {
  it("should render description button", () => {
    renderQuickActions();
    expect(
      screen.getByRole("button", { name: /редактировать заметку/i }),
    ).toBeInTheDocument();
  });

  it("should render goal button", () => {
    renderQuickActions();
    expect(
      screen.getByRole("button", { name: /выбрать цель/i }),
    ).toBeInTheDocument();
  });

  it("should render box button", () => {
    renderQuickActions();
    expect(
      screen.getByRole("button", { name: /переместить/i }),
    ).toBeInTheDocument();
  });

  it("should render full edit button", () => {
    renderQuickActions();
    expect(
      screen.getByRole("button", { name: /открыть редактирование/i }),
    ).toBeInTheDocument();
  });

  it("should show description textarea when description button is clicked", async () => {
    renderQuickActions();
    await userEvent.click(
      screen.getByRole("button", { name: /редактировать заметку/i }),
    );
    expect(screen.getByTestId("quick-description-input")).toBeInTheDocument();
  });

  it("should hide description textarea when description button is clicked again", async () => {
    renderQuickActions();
    await userEvent.click(
      screen.getByRole("button", { name: /редактировать заметку/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /редактировать заметку/i }),
    );
    expect(screen.queryByTestId("quick-description-input")).not.toBeInTheDocument();
  });

  it("should prefill description textarea with task description", async () => {
    const task = buildTask({ description: "existing description" });
    renderQuickActions({ task });
    await userEvent.click(
      screen.getByRole("button", { name: /редактировать заметку/i }),
    );
    expect(screen.getByTestId("quick-description-input")).toHaveValue(
      "existing description",
    );
  });

  it("should call onUpdate with new description when description saved via Enter", async () => {
    const task = buildTask({ description: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, onUpdate });
    await userEvent.click(
      screen.getByRole("button", { name: /редактировать заметку/i }),
    );
    const textarea = screen.getByTestId("quick-description-input");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "new description");
    await userEvent.keyboard("{Enter}");
    expect(onUpdate).toHaveBeenCalledWith(task.id, { description: "new description" });
  });

  it("should save description when description textarea loses focus", async () => {
    const task = buildTask({ description: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, onUpdate });
    await userEvent.click(
      screen.getByRole("button", { name: /редактировать заметку/i }),
    );
    const textarea = screen.getByTestId("quick-description-input");
    await userEvent.type(textarea, "заметка iOS Done");
    fireEvent.blur(textarea);
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(task.id, {
        description: "заметка iOS Done",
      });
    });
  });

  it("should show goal list when goal button is clicked", async () => {
    const goal = buildGoal({ name: "Launch app" });
    renderQuickActions({ goals: [goal] });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать цель/i }),
    );
    expect(screen.getByText("Launch app")).toBeInTheDocument();
  });

  it("should hide goal list when goal button is clicked again", async () => {
    const goal = buildGoal({ name: "Launch app" });
    renderQuickActions({ goals: [goal] });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать цель/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать цель/i }),
    );
    expect(screen.queryByText("Launch app")).not.toBeInTheDocument();
  });

  it("should call onUpdate with goal_id when goal selected", async () => {
    const goal = buildGoal({ name: "Launch app" });
    const task = buildTask({ goal_id: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, goals: [goal], onUpdate });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать цель/i }),
    );
    await userEvent.click(screen.getByText("Launch app"));
    expect(onUpdate).toHaveBeenCalledWith(task.id, { goal_id: goal.id });
  });

  it("should show box options when box button is clicked", async () => {
    renderQuickActions();
    await userEvent.click(screen.getByRole("button", { name: /переместить/i }));
    expect(
      screen.getByRole("button", { name: /сегодня/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /неделя/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /позже/i })).toBeInTheDocument();
  });

  it("should call onMove with today when today selected", async () => {
    const task = buildTask();
    const onMove = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, onMove });
    await userEvent.click(screen.getByRole("button", { name: /переместить/i }));
    await userEvent.click(screen.getByRole("button", { name: /сегодня/i }));
    expect(onMove).toHaveBeenCalledWith(task.id, BOX.TODAY);
  });

  it("should call onMove with week when week selected", async () => {
    const task = buildTask();
    const onMove = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, onMove });
    await userEvent.click(screen.getByRole("button", { name: /переместить/i }));
    await userEvent.click(screen.getByRole("button", { name: /неделя/i }));
    expect(onMove).toHaveBeenCalledWith(task.id, BOX.WEEK);
  });

  it("should call onMove with later when later selected", async () => {
    const task = buildTask();
    const onMove = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, onMove });
    await userEvent.click(screen.getByRole("button", { name: /переместить/i }));
    await userEvent.click(screen.getByRole("button", { name: /позже/i }));
    expect(onMove).toHaveBeenCalledWith(task.id, BOX.LATER);
  });

  it("should call onOpenEdit when full edit button is clicked", async () => {
    const onOpenEdit = vi.fn();
    renderQuickActions({ onOpenEdit });
    await userEvent.click(
      screen.getByRole("button", { name: /открыть редактирование/i }),
    );
    expect(onOpenEdit).toHaveBeenCalled();
  });

  it("should show no goal option in goal picker", async () => {
    renderQuickActions({ goals: [buildGoal()] });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать цель/i }),
    );
    expect(
      screen.getByRole("button", { name: /без цели/i }),
    ).toBeInTheDocument();
  });

  it("should call onUpdate with empty goal_id when no goal selected", async () => {
    const task = buildTask({ goal_id: "some-goal-id" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, goals: [buildGoal()], onUpdate });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать цель/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /без цели/i }));
    expect(onUpdate).toHaveBeenCalledWith(task.id, { goal_id: "" });
  });

  it("should render context button", () => {
    renderQuickActions();
    expect(
      screen.getByRole("button", { name: /выбрать контекст/i }),
    ).toBeInTheDocument();
  });

  it("should render category button", () => {
    renderQuickActions();
    expect(
      screen.getByRole("button", { name: /выбрать категорию/i }),
    ).toBeInTheDocument();
  });

  it("should show context list when context button is clicked", async () => {
    const context = buildContext({ name: "@Home" });
    renderQuickActions({ contexts: [context] });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать контекст/i }),
    );
    expect(screen.getByText("@Home")).toBeInTheDocument();
  });

  it("should hide context list when context button is clicked again", async () => {
    const context = buildContext({ name: "@Home" });
    renderQuickActions({ contexts: [context] });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать контекст/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать контекст/i }),
    );
    expect(screen.queryByText("@Home")).not.toBeInTheDocument();
  });

  it("should call onUpdate with context_id when context selected", async () => {
    const context = buildContext({ name: "@Home" });
    const task = buildTask({ context_id: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, contexts: [context], onUpdate });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать контекст/i }),
    );
    await userEvent.click(screen.getByText("@Home"));
    expect(onUpdate).toHaveBeenCalledWith(task.id, { context_id: context.id });
  });

  it("should call onUpdate with empty context_id when no context selected", async () => {
    const task = buildTask({ context_id: "some-context-id" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, contexts: [buildContext()], onUpdate });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать контекст/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /без контекста/i }),
    );
    expect(onUpdate).toHaveBeenCalledWith(task.id, { context_id: "" });
  });

  it("should show category list when category button is clicked", async () => {
    const category = buildCategory({ name: "Work" });
    renderQuickActions({ categories: [category] });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать категорию/i }),
    );
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("should hide category list when category button is clicked again", async () => {
    const category = buildCategory({ name: "Work" });
    renderQuickActions({ categories: [category] });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать категорию/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать категорию/i }),
    );
    expect(screen.queryByText("Work")).not.toBeInTheDocument();
  });

  it("should call onUpdate with category_id when category selected", async () => {
    const category = buildCategory({ name: "Work" });
    const task = buildTask({ category_id: "" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, categories: [category], onUpdate });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать категорию/i }),
    );
    await userEvent.click(screen.getByText("Work"));
    expect(onUpdate).toHaveBeenCalledWith(task.id, {
      category_id: category.id,
    });
  });

  it("should call onUpdate with empty category_id when no category selected", async () => {
    const task = buildTask({ category_id: "some-category-id" });
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    renderQuickActions({ task, categories: [buildCategory()], onUpdate });
    await userEvent.click(
      screen.getByRole("button", { name: /выбрать категорию/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /без категории/i }),
    );
    expect(onUpdate).toHaveBeenCalledWith(task.id, { category_id: "" });
  });
});
