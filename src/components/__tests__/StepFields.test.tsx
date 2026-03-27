import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepFields from "../StepFields";
import { createEmptyStep } from "../../lib/flow";

describe("StepFields", () => {
  it("renders title input with current value", () => {
    const step = createEmptyStep();
    step.title = "My Step";
    render(<StepFields step={step} onChange={() => {}} />);
    expect(screen.getByDisplayValue("My Step")).toBeInTheDocument();
  });

  it("calls onChange when title changes", async () => {
    const user = userEvent.setup();
    const step = createEmptyStep();
    const onChange = vi.fn();
    render(<StepFields step={step} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Step Title");
    await user.type(input, "A");

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0]![0].title).toBe("A");
  });

  it("shows agent name field for chat_agent type", () => {
    const step = createEmptyStep("chat_agent");
    render(<StepFields step={step} onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Chat Agent Name")).toBeInTheDocument();
  });

  it("hides agent name field for non-chat_agent types", () => {
    const step = createEmptyStep("web_search");
    render(<StepFields step={step} onChange={() => {}} />);
    expect(screen.queryByPlaceholderText("Chat Agent Name")).not.toBeInTheDocument();
  });

  it("shows source/output/creativity for general_knowledge", () => {
    const step = createEmptyStep("general_knowledge");
    render(<StepFields step={step} onChange={() => {}} />);
    expect(screen.getByText("Creativity:")).toBeInTheDocument();
  });

  it("shows prompt textarea for prompt step types", () => {
    const step = createEmptyStep("general_knowledge");
    render(<StepFields step={step} onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Prompt / Instructions")).toBeInTheDocument();
  });

  it("hides prompt textarea for user_input_files", () => {
    const step = createEmptyStep("user_input_files");
    render(<StepFields step={step} onChange={() => {}} />);
    expect(screen.queryByPlaceholderText("Prompt / Instructions")).not.toBeInTheDocument();
  });

  it("shows placeholder/default for user_input_text", () => {
    const step = createEmptyStep("user_input_text");
    render(<StepFields step={step} onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Placeholder")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Default value")).toBeInTheDocument();
  });

  it("shows config textarea for app_actions", () => {
    const step = createEmptyStep("app_actions");
    render(<StepFields step={step} onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Configuration")).toBeInTheDocument();
  });

  it("always shows references input", () => {
    const step = createEmptyStep();
    render(<StepFields step={step} onChange={() => {}} />);
    expect(
      screen.getByPlaceholderText("@References (comma-separated)"),
    ).toBeInTheDocument();
  });
});
