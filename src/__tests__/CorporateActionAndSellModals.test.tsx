import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CorporateActionModal } from "../components/modals/CorporateActionModal";
import { FifoSellModal } from "../components/modals/FifoSellModal";
import { SellStockModal } from "../components/modals/SellStockModal";

describe("CorporateActionModal — Stock Splits & Bonus Issues Terminal", () => {
  const mockGroup = {
    base: "TCS",
    exchange: "NSE",
    lots: [
      {
        id: "lot-1",
        symbol: "TCS",
        exchange: "NSE",
        qty: 10,
        buyPrice: 3000,
        avgPrice: 3000,
        buyDate: "2023-01-15",
        broker: "Zerodha",
      },
      {
        id: "lot-2",
        symbol: "TCS",
        exchange: "NSE",
        qty: 20,
        buyPrice: 3600,
        avgPrice: 3600,
        buyDate: "2024-06-10",
        broker: "Groww",
      },
    ],
    totalQty: 30,
    avgPrice: 3400,
    invested: 102000,
    curPrice: 4000,
    currentVal: 120000,
    unrealizedPL: 18000,
  };

  const defaultProps = {
    group: mockGroup,
    onClose: vi.fn(),
    onApply: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders wide-screen dual-pane corporate action simulation terminal", () => {
    render(<CorporateActionModal {...defaultProps} />);

    expect(screen.getByText("Corporate Action — TCS")).toBeInTheDocument();
    expect(
      screen.getByText(/Stock Splits & Bonus Issue Ledger/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Position Readjustment Simulation")).toBeInTheDocument();
    expect(screen.getByText("Total Capital Preserved")).toBeInTheDocument();
    expect(screen.getByText(/Zero Inflow \/ Outflow/i)).toBeInTheDocument();
  });

  it("calculates 10:1 stock split accurately and preserves capital", () => {
    render(<CorporateActionModal {...defaultProps} />);

    // Select 10:1 split preset chip
    const split10Chip = screen.getByRole("button", { name: /10\s*:\s*1/i });
    fireEvent.click(split10Chip);

    // Initial shares: 30. Post 10:1 split: 30 * 10 = 300
    expect(screen.getByText("300")).toBeInTheDocument();

    // Check preview table has adjusted quantities (lot 1: 100 sh, lot 2: 200 sh)
    expect(screen.getByText("100 sh")).toBeInTheDocument();
    expect(screen.getByText("200 sh")).toBeInTheDocument();
  });

  it("calculates 1:1 bonus issue accurately and adjusts cost basis", () => {
    render(<CorporateActionModal {...defaultProps} />);

    // Switch to Bonus Issue
    const bonusButton = screen.getByRole("button", { name: /Bonus Issue/i });
    fireEvent.click(bonusButton);

    // Select 1:1 bonus preset chip
    const bonus11Chip = screen.getByRole("button", { name: /1\s*:\s*1/i });
    fireEvent.click(bonus11Chip);

    // Initial shares: 30. 1:1 Bonus creates 30 new shares -> Total 60 shares
    expect(screen.getByText("60")).toBeInTheDocument();

    // Tax treatment text should mention Section 55(2)(aa)
    expect(screen.getByText(/Section 55\(2\)\(aa\)/i)).toBeInTheDocument();
  });

  it("submits onApply with valid corporate action payload", async () => {
    render(<CorporateActionModal {...defaultProps} />);

    const submitBtn = screen.getByRole("button", { name: /Apply Split/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(defaultProps.onApply).toHaveBeenCalledTimes(1);
    });

    const [updates, actionLog, removals] = defaultProps.onApply.mock.calls[0];
    expect(updates.length).toBe(2);
    expect(actionLog.symbol).toBe("TCS");
    expect(actionLog.exchange).toBe("NSE");
    expect(removals).toEqual([]);
  });
});

describe("FifoSellModal — Automated FIFO Order Allocation Terminal", () => {
  const mockLots = [
    {
      id: "lot-1",
      symbol: "RELIANCE",
      exchange: "NSE",
      qty: 15,
      buyPrice: 2000,
      avgPrice: 2000,
      buyDate: "2023-01-10", // > 1 year -> LTCG
      broker: "Zerodha",
    },
    {
      id: "lot-2",
      symbol: "RELIANCE",
      exchange: "NSE",
      qty: 25,
      buyPrice: 2500,
      avgPrice: 2500,
      buyDate: "2026-05-15", // < 1 year -> STCG
      broker: "Zerodha",
    },
  ];

  const mockGroup = {
    base: "RELIANCE",
    exchange: "NSE",
    lots: mockLots,
    totalQty: 40,
    avgPrice: 2312.5,
    invested: 92500,
    curPrice: 3000,
  };

  const mockDemats = [
    { id: "demat-1", broker: "Zerodha", clientId: "ZL123" },
    { id: "demat-2", broker: "Groww", clientId: "GW456" },
  ];

  const defaultProps = {
    group: mockGroup,
    currentPrice: 3000,
    demats: mockDemats,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders dual-pane FIFO terminal and orders lots chronologically", () => {
    render(<FifoSellModal {...defaultProps} />);

    expect(screen.getByText("FIFO Share Sell — RELIANCE")).toBeInTheDocument();
    expect(
      screen.getByText(/Automated First-In-First-Out Execution/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Chronological FIFO Allocation Ledger/i)).toBeInTheDocument();
    expect(screen.getAllByText(/LTCG \(12\.5%\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/STCG \(20\.0%\)/i).length).toBeGreaterThan(0);
  });

  it("allocates across multiple lots using FIFO principle when selling 20 shares", () => {
    render(<FifoSellModal {...defaultProps} />);

    // Sell 20 shares:
    // Lot 1 (15 shares) should be fully depleted (15 consumed)
    // Lot 2 (25 shares) should be partially depleted (5 consumed, 20 remain)
    const qtyInput = screen.getByLabelText(/Total Sell Qty/i) as HTMLInputElement;
    fireEvent.change(qtyInput, { target: { value: "20" } });

    // Both lots should appear in allocation queue
    expect(screen.getByText("15 sh")).toBeInTheDocument();
    expect(screen.getByText("5 sh")).toBeInTheDocument();
    expect(screen.getByText(/Full Lot/i)).toBeInTheDocument();

    // Check remaining total position (40 - 20 = 20)
    expect(screen.getByText(/20 shares retained/i)).toBeInTheDocument();
  });

  it("supports quick percentage chips (e.g. 50%, All (100%))", () => {
    render(<FifoSellModal {...defaultProps} />);

    const chip50 = screen.getByRole("button", { name: "50%" });
    fireEvent.click(chip50);

    const qtyInput = screen.getByLabelText(/Total Sell Qty/i) as HTMLInputElement;
    expect(qtyInput.value).toBe("20");

    const chip100 = screen.getByRole("button", { name: /All \(100%\)/i });
    fireEvent.click(chip100);
    expect(qtyInput.value).toBe("40");
  });

  it("calls onSave with correct fifo allocations when submitted", async () => {
    render(<FifoSellModal {...defaultProps} />);

    const qtyInput = screen.getByLabelText(/Total Sell Qty/i) as HTMLInputElement;
    fireEvent.change(qtyInput, { target: { value: "10" } });

    const submitBtn = screen.getByRole("button", { name: /Confirm FIFO Sell/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });

    const [allocs, sellPrice, sellDate, broker] = defaultProps.onSave.mock.calls[0];
    expect(allocs.length).toBe(1);
    expect(allocs[0].consume).toBe(10);
    expect(sellPrice).toBe(3000);
    expect(typeof sellDate).toBe("string");
    expect(broker).toBe("Zerodha");
  });
});

describe("SellStockModal — Single Lot Sell & Realization Terminal", () => {
  const mockLot = {
    id: "lot-99",
    symbol: "INFY",
    exchange: "NSE",
    qty: 50,
    buyPrice: 1400,
    avgPrice: 1400,
    buyDate: "2023-03-01", // > 1 year -> LTCG
    currentPrice: 1800,
    broker: "Zerodha",
    dematId: "demat-1",
  };

  const defaultProps = {
    lot: mockLot,
    currentPrice: 1800,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders single lot sell terminal with tax and gain realization", () => {
    render(<SellStockModal {...defaultProps} />);

    expect(screen.getByText("Sell Shares — INFY")).toBeInTheDocument();
    expect(
      screen.getByText(/Specific Lot Liquidation • Realized P&L & Capital Gains Calculator/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Gross Sell Proceeds/i)).toBeInTheDocument();
    expect(screen.getByText(/Net Realized Profit/i)).toBeInTheDocument();
    expect(screen.getByText(/12\.5% Tax \(Section 112A\)/i)).toBeInTheDocument();
  });

  it("calculates partial sell (25 shares) and remaining balance", () => {
    render(<SellStockModal {...defaultProps} />);

    const chip50 = screen.getByRole("button", { name: "50%" });
    fireEvent.click(chip50);

    const qtyInput = screen.getByLabelText(/Sell Quantity/i) as HTMLInputElement;
    expect(qtyInput.value).toBe("25");

    // Remaining lot balance should be 25 shares remaining
    expect(screen.getByText(/25 shares remaining/i)).toBeInTheDocument();
  });

  it("calls onSave with complete transaction and tax metadata", async () => {
    render(<SellStockModal {...defaultProps} />);

    const chip100 = screen.getByRole("button", { name: /All \(100%\)/i });
    fireEvent.click(chip100);

    const submitBtn = screen.getByRole("button", { name: /Confirm Sell Order/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });

    const [record, remainingQty] = defaultProps.onSave.mock.calls[0];
    expect(record.symbol).toBe("INFY");
    expect(record.qty).toBe(50);
    expect(record.sellPrice).toBe(1800);
    expect(record.profit).toBe(20000); // 50 * (1800 - 1400) = 20,000
    expect(remainingQty).toBe(0);
  });
});
