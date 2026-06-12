import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EditableDescription } from "./EditableDescription";

describe("EditableDescription", () => {
  it("should render markdown in view mode when value is not empty", () => {
    render(
      <EditableDescription
        value="Check https://example.com"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Check")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://example.com",
    );
  });

  it("should display placeholder when value is empty", () => {
    render(
      <EditableDescription
        value=""
        onChange={vi.fn()}
        placeholder="Enter description"
      />,
    );

    expect(screen.getByText("Enter description")).toBeInTheDocument();
  });

  it("should switch to edit mode on click", async () => {
    const user = userEvent.setup();
    render(<EditableDescription value="Some text" onChange={vi.fn()} />);

    await user.click(screen.getByText("Some text"));

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue("Some text");
  });

  it("should not switch to edit mode when clicking on link", async () => {
    const user = userEvent.setup();
    render(
      <EditableDescription
        value="Visit https://example.com"
        onChange={vi.fn()}
      />,
    );

    const link = screen.getByRole("link");
    await user.click(link);

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("should autofocus textarea when switching to edit mode", async () => {
    const user = userEvent.setup();
    render(<EditableDescription value="Some text" onChange={vi.fn()} />);

    await user.click(screen.getByText("Some text"));

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveFocus();
  });

  it("should call onChange when textarea value changes", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<EditableDescription value="Initial" onChange={handleChange} />);

    await user.click(screen.getByText("Initial"));
    const textarea = screen.getByRole("textbox");

    await user.clear(textarea);

    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("should switch back to view mode on blur", async () => {
    const user = userEvent.setup();
    render(<EditableDescription value="Some text" onChange={vi.fn()} />);

    await user.click(screen.getByText("Some text"));
    const textarea = screen.getByRole("textbox");

    await user.click(document.body);

    expect(textarea).not.toBeInTheDocument();
    expect(screen.getByText("Some text")).toBeInTheDocument();
  });

  it("should call onBlur callback when textarea loses focus", async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();

    render(
      <EditableDescription
        value="Some text"
        onChange={vi.fn()}
        onBlur={handleBlur}
      />,
    );

    await user.click(screen.getByText("Some text"));
    await user.click(document.body);

    expect(handleBlur).toHaveBeenCalled();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <EditableDescription
        value="Text"
        onChange={vi.fn()}
        className="custom-class"
      />,
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should pass data-test-id to container", () => {
    render(
      <EditableDescription
        value="Text"
        onChange={vi.fn()}
        data-test-id="test-description"
      />,
    );

    expect(screen.getByTestId("test-description")).toBeInTheDocument();
  });

  it("should switch to edit mode when clicking placeholder", async () => {
    const user = userEvent.setup();
    render(
      <EditableDescription
        value=""
        onChange={vi.fn()}
        placeholder="Click to edit"
      />,
    );

    await user.click(screen.getByText("Click to edit"));

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("should display full URL in textarea when editing", async () => {
    const user = userEvent.setup();
    render(
      <EditableDescription
        value="Visit https://example.com/very/long/path"
        onChange={vi.fn()}
      />,
    );

    await user.click(screen.getByText("Visit"));
    const textarea = screen.getByRole("textbox");

    expect(textarea).toHaveValue("Visit https://example.com/very/long/path");
  });
});
