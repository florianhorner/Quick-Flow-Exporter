import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "../ErrorBoundary";

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("kaboom");
  return <div>All good</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    // Suppress React's console.error for the expected error
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("kaboom")).toBeInTheDocument();
  });

  it("resets error state when Try Again is clicked", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();

    // Use a ref-like flag so we can control throwing after reset
    let shouldThrow = true;
    function Controlled() {
      if (shouldThrow) throw new Error("kaboom");
      return <div>All good</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <Controlled />
      </ErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Stop throwing before clicking Try Again
    shouldThrow = false;
    await user.click(screen.getByText("Try Again"));

    // Force rerender so the boundary re-renders children
    rerender(
      <ErrorBoundary>
        <Controlled />
      </ErrorBoundary>,
    );

    expect(screen.getByText("All good")).toBeInTheDocument();
  });
});
