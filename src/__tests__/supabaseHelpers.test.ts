import { describe, it, expect, vi } from "vitest";
import { fetchAllRowsFromTable } from "../utils/supabaseHelpers";

describe("fetchAllRowsFromTable", () => {
  it("fetches a single page when count is less than pageSize", async () => {
    const mockData = Array.from({ length: 50 }, (_, i) => ({ id: `row-${i}` }));
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      }),
    };

    const result = await fetchAllRowsFromTable(mockClient, "transactions", "user-1", { pageSize: 100 });
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(50);
  });

  it("paginates multiple pages when total records exceed pageSize (e.g. >1000 items)", async () => {
    // Total 1250 items, pageSize 500 => 3 pages (500, 500, 250)
    const page1 = Array.from({ length: 500 }, (_, i) => ({ id: `row-${i}` }));
    const page2 = Array.from({ length: 500 }, (_, i) => ({ id: `row-${500 + i}` }));
    const page3 = Array.from({ length: 250 }, (_, i) => ({ id: `row-${1000 + i}` }));

    let callCount = 0;
    const rangeMock = vi.fn().mockImplementation((from: number, to: number) => {
      callCount++;
      if (from === 0) return Promise.resolve({ data: page1, error: null });
      if (from === 500) return Promise.resolve({ data: page2, error: null });
      if (from === 1000) return Promise.resolve({ data: page3, error: null });
      return Promise.resolve({ data: [], error: null });
    });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: rangeMock,
              }),
            }),
          }),
        }),
      }),
    };

    const result = await fetchAllRowsFromTable(mockClient, "transactions", "user-1", {
      pageSize: 500,
      orderColumn: "date",
      ascending: false,
      secondaryOrderColumn: "id",
      secondaryAscending: true,
    });

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1250);
    expect(callCount).toBe(3);
    expect(rangeMock).toHaveBeenNthCalledWith(1, 0, 499);
    expect(rangeMock).toHaveBeenNthCalledWith(2, 500, 999);
    expect(rangeMock).toHaveBeenNthCalledWith(3, 1000, 1499);
  });

  it("handles exact multiple of pageSize correctly without infinite loop", async () => {
    const page1 = Array.from({ length: 500 }, (_, i) => ({ id: `row-${i}` }));
    const page2 = Array.from({ length: 500 }, (_, i) => ({ id: `row-${500 + i}` }));
    const emptyPage: any[] = [];

    const rangeMock = vi.fn().mockImplementation((from: number) => {
      if (from === 0) return Promise.resolve({ data: page1, error: null });
      if (from === 500) return Promise.resolve({ data: page2, error: null });
      return Promise.resolve({ data: emptyPage, error: null });
    });

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            range: rangeMock,
          }),
        }),
      }),
    };

    const result = await fetchAllRowsFromTable(mockClient, "transactions", "user-1", { pageSize: 500 });
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1000);
  });

  it("returns error on initial query failure", async () => {
    const mockError = { message: "relation does not exist", code: "42P01" };
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({ data: null, error: mockError }),
          }),
        }),
      }),
    };

    const result = await fetchAllRowsFromTable(mockClient, "transactions", "user-1");
    expect(result.data).toBeNull();
    expect(result.error).toEqual(mockError);
  });
});
