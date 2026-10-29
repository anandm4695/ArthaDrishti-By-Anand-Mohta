import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaginationBar } from "../components/ui/PaginationBar";

describe("PaginationBar Component", () => {
  it("renders correctly with total pages and record details", () => {
    const handlePageChange = vi.fn();
    render(
      <PaginationBar
        currentPage={3}
        totalPages={16}
        totalRecords={640}
        pageSize={40}
        onPageChange={handlePageChange}
      />
    );

    // Record count
    expect(screen.getByText(/Showing/i)).toBeTruthy();
    expect(screen.getByText("81–120")).toBeTruthy();
    expect(screen.getByText("640")).toBeTruthy();

    // Current page pill
    const currentBtn = screen.getByRole("button", { name: "3" });
    expect(currentBtn.getAttribute("aria-current")).toBe("page");

    // Prev and Next buttons exist
    expect(screen.getByRole("button", { name: /previous page/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /next page/i })).toBeTruthy();
  });

  it("handles next and previous button clicks", () => {
    const handlePageChange = vi.fn();
    render(
      <PaginationBar
        currentPage={3}
        totalPages={16}
        totalRecords={640}
        pageSize={40}
        onPageChange={handlePageChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(handlePageChange).toHaveBeenCalledWith(4);

    fireEvent.click(screen.getByRole("button", { name: /previous page/i }));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it("allows jumping directly to page 11 via Go to input", () => {
    const handlePageChange = vi.fn();
    render(
      <PaginationBar
        currentPage={3}
        totalPages={16}
        totalRecords={640}
        pageSize={40}
        onPageChange={handlePageChange}
      />
    );

    const input = screen.getByLabelText(/go to page number/i);
    fireEvent.change(input, { target: { value: "11" } });
    fireEvent.submit(input.closest("form")!);

    expect(handlePageChange).toHaveBeenCalledWith(11);
  });

  it("clamps invalid out-of-range inputs in Go to form", () => {
    const handlePageChange = vi.fn();
    render(
      <PaginationBar
        currentPage={3}
        totalPages={16}
        totalRecords={640}
        pageSize={40}
        onPageChange={handlePageChange}
      />
    );

    const input = screen.getByLabelText(/go to page number/i);
    fireEvent.change(input, { target: { value: "99" } });
    fireEvent.submit(input.closest("form")!);

    // Clamps to max 16
    expect(handlePageChange).toHaveBeenCalledWith(16);
  });

  it("disables Prev button on first page and Next button on last page", () => {
    const { rerender } = render(
      <PaginationBar
        currentPage={1}
        totalPages={10}
        onPageChange={() => {}}
      />
    );

    const prevBtn = screen.getByRole("button", { name: /previous page/i }) as HTMLButtonElement;
    const nextBtn = screen.getByRole("button", { name: /next page/i }) as HTMLButtonElement;
    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(false);

    rerender(
      <PaginationBar
        currentPage={10}
        totalPages={10}
        onPageChange={() => {}}
      />
    );

    const prevBtn2 = screen.getByRole("button", { name: /previous page/i }) as HTMLButtonElement;
    const nextBtn2 = screen.getByRole("button", { name: /next page/i }) as HTMLButtonElement;
    expect(prevBtn2.disabled).toBe(false);
    expect(nextBtn2.disabled).toBe(true);
  });
});
