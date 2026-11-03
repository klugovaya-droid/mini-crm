import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";

describe("StatusBadge", () => {
  it("renders the Russian status label", () => {
    render(<StatusBadge status="rework" />);
    expect(screen.getByText("На доработке")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders a title and description", () => {
    render(<EmptyState title="Пусто" description="Пока ничего нет" />);

    expect(screen.getByText("Пусто")).toBeInTheDocument();
    expect(screen.getByText("Пока ничего нет")).toBeInTheDocument();
  });
});
