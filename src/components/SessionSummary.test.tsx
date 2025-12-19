/**
 * @vitest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SessionSummary } from "./SessionSummary";

describe("SessionSummary", () => {
  const mockOnRestart = vi.fn();

  beforeEach(() => {
    mockOnRestart.mockClear();
  });

  it("calculates and displays accuracy when total > 0", () => {
    render(
      <SessionSummary
        stats={{ total: 10, correct: 7, masteredSkills: [] }}
        onRestart={mockOnRestart}
      />
    );

    expect(screen.getByText("70%")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("displays 0% accuracy when total is 0 (edge case)", () => {
    render(
      <SessionSummary
        stats={{ total: 0, correct: 0, masteredSkills: [] }}
        onRestart={mockOnRestart}
      />
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows fallback message when masteredSkills is empty", () => {
    render(
      <SessionSummary
        stats={{ total: 5, correct: 3, masteredSkills: [] }}
        onRestart={mockOnRestart}
      />
    );

    expect(
      screen.getByText("Keep practicing to master new skills!")
    ).toBeInTheDocument();
  });

  it("renders mastered skills list when populated", () => {
    render(
      <SessionSummary
        stats={{
          total: 10,
          correct: 10,
          masteredSkills: ["Addition", "Subtraction"],
        }}
        onRestart={mockOnRestart}
      />
    );

    expect(screen.getByText(/Addition/)).toBeInTheDocument();
    expect(screen.getByText(/Subtraction/)).toBeInTheDocument();
    expect(
      screen.queryByText("Keep practicing to master new skills!")
    ).not.toBeInTheDocument();
  });

  it("calls onRestart when button is clicked", () => {
    render(
      <SessionSummary
        stats={{ total: 5, correct: 5, masteredSkills: [] }}
        onRestart={mockOnRestart}
      />
    );

    fireEvent.click(screen.getByText("Start New Session"));
    expect(mockOnRestart).toHaveBeenCalledTimes(1);
  });
});
