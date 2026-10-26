import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { StockScripModal } from "../components/modals/StockScripModal";

describe("StockScripModal — Wide-Screen Smart Scrip Terminal", () => {
  const mockDemats = [
    { id: "demat-1", broker: "Zerodha", clientId: "ZL1234" },
    { id: "demat-2", broker: "Groww", clientId: "GR9876" },
  ];

  const mockMarketData = {
    "RELIANCE.NS": {
      price: 2850.5,
      change: 32.5,
      changePercent: 1.15,
      weekLow52: 2220.0,
      weekHigh52: 3024.0,
      sector: "Energy & Petrochemicals",
    },
    "TCS.NS": {
      price: 3950.0,
      change: -15.0,
      changePercent: -0.38,
      weekLow52: 3300.0,
      weekHigh52: 4500.0,
      sector: "Information Technology",
    },
  };

  const defaultProps = {
    demats: mockDemats,
    marketData: mockMarketData,
    existingStocks: [
      { id: "st-1", symbol: "INFY", qty: 20, avgPrice: 1500, currentPrice: 1600 },
    ],
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders wide-screen smart terminal layout with scrip discovery and financial simulation", () => {
    render(<StockScripModal {...defaultProps} />);

    // Header & Subheader
    expect(screen.getByText("Add Stock Scrip")).toBeInTheDocument();
    expect(
      screen.getByText(/Smart Equity Command Terminal • Live Portfolio Intelligence/i)
    ).toBeInTheDocument();

    // Sections
    expect(screen.getByText(/Scrip & Exchange Selection/i)).toBeInTheDocument();
    expect(screen.getByText(/Portfolio & Demat Assignment/i)).toBeInTheDocument();
    expect(screen.getByText(/Transaction & Price Parameters/i)).toBeInTheDocument();
    expect(screen.getByText(/Investment Order Math & Simulation/i)).toBeInTheDocument();
  });

  it("allows selecting a popular Indian stock chip and updates form state", () => {
    render(<StockScripModal {...defaultProps} />);

    // Click on RELIANCE quick chip
    const relianceChip = screen.getByRole("button", { name: "RELIANCE" });
    fireEvent.click(relianceChip);

    const symbolInput = screen.getByPlaceholderText(/e\.g\. RELIANCE, TCS, INFY/i) as HTMLInputElement;
    expect(symbolInput.value).toBe("RELIANCE");

    // Live quote badge should appear in header/card
    expect(screen.getByText(/Reliance Industries Ltd/i)).toBeInTheDocument();
  });

  it("calculates total investment, current value, and unrealized profit accurately", async () => {
    render(<StockScripModal {...defaultProps} />);

    // Pick TCS
    const tcsChip = screen.getByRole("button", { name: "TCS" });
    fireEvent.click(tcsChip);

    // Enter Qty: 10
    const qtyInput = screen.getByPlaceholderText("e.g. 50") as HTMLInputElement;
    fireEvent.change(qtyInput, { target: { value: "10" } });

    // Enter Buy Price: 3500
    const buyPriceInput = screen.getByPlaceholderText("e.g. 2450.50") as HTMLInputElement;
    fireEvent.change(buyPriceInput, { target: { value: "3500" } });

    // Enter Current Price: 4000
    const currentPriceInput = screen.getByLabelText(/Current Price/i) as HTMLInputElement;
    fireEvent.change(currentPriceInput, { target: { value: "4000" } });

    // Total Invested = 10 * 3500 = ₹35,000
    // Current Value = 10 * 4000 = ₹40,000
    // Unrealized P&L = +₹5,000 (+14.29%)
    expect(screen.getByText(/Unrealized Profit/i)).toBeInTheDocument();
    expect(screen.getByText(/14\.29%/i)).toBeInTheDocument();
  });

  it("provides quick stepper buttons to increment and decrement quantity", () => {
    render(<StockScripModal {...defaultProps} />);

    const qtyInput = screen.getByPlaceholderText("e.g. 50") as HTMLInputElement;
    expect(qtyInput.value).toBe("");

    // Click "+10" preset chip
    const plusTenBtn = screen.getByRole("button", { name: "+10" });
    fireEvent.click(plusTenBtn);
    expect(qtyInput.value).toBe("10");

    // Click stepper [+] button
    const plusOneBtn = screen.getByTitle("Increase by 1");
    fireEvent.click(plusOneBtn);
    expect(qtyInput.value).toBe("11");

    // Click stepper [-] button
    const minusOneBtn = screen.getByTitle("Decrease by 1");
    fireEvent.click(minusOneBtn);
    expect(qtyInput.value).toBe("10");
  });

  it("determines correct tax status (STCG vs LTCG) based on buy date", () => {
    render(<StockScripModal {...defaultProps} />);

    // Default buyDate is today -> STCG
    expect(screen.getByText(/STCG \(Short-Term Capital Gain\)/i)).toBeInTheDocument();
    expect(screen.getByText(/20% Tax \(Sec 111A\)/i)).toBeInTheDocument();

    // Click "1Y Ago" preset
    const oneYrAgoBtn = screen.getByRole("button", { name: "1Y Ago" });
    fireEvent.click(oneYrAgoBtn);

    // After setting to 1 year ago -> LTCG
    expect(screen.getByText(/LTCG \(Long-Term Capital Gain\)/i)).toBeInTheDocument();
    expect(screen.getByText(/12\.5% Tax \(Sec 112A\)/i)).toBeInTheDocument();
  });

  it("expands estimated statutory levies and shows net breakeven per share", () => {
    render(<StockScripModal {...defaultProps} />);

    // Fill Qty and Buy Price
    const relianceChip = screen.getByRole("button", { name: "RELIANCE" });
    fireEvent.click(relianceChip);

    const qtyInput = screen.getByPlaceholderText("e.g. 50");
    fireEvent.change(qtyInput, { target: { value: "100" } });

    const buyPriceInput = screen.getByPlaceholderText("e.g. 2450.50");
    fireEvent.change(buyPriceInput, { target: { value: "2500" } });

    // Click to expand statutory levies
    const chargesToggle = screen.getByText(/Estimated Statutory Levies & Breakeven/i);
    fireEvent.click(chargesToggle);

    expect(screen.getByText(/Securities Transaction Tax \(STT 0\.1%\):/i)).toBeInTheDocument();
    expect(screen.getByText(/Stamp Duty \(0\.015% on buy\):/i)).toBeInTheDocument();
    expect(screen.getByText(/Net Effective Breakeven per share:/i)).toBeInTheDocument();
  });

  it("validates required fields and calls onSave when valid", () => {
    const onSave = vi.fn();
    render(<StockScripModal {...defaultProps} onSave={onSave} />);

    // Initially Save button should be disabled because fields are missing
    const saveBtn = screen.getByRole("button", { name: /Add Scrip to Portfolio/i });
    expect(saveBtn).toBeDisabled();

    // Select RELIANCE
    const relianceChip = screen.getByRole("button", { name: "RELIANCE" });
    fireEvent.click(relianceChip);

    // Fill Qty: 25
    const qtyInput = screen.getByPlaceholderText("e.g. 50");
    fireEvent.change(qtyInput, { target: { value: "25" } });

    // Fill Buy Price: 2800
    const buyPriceInput = screen.getByPlaceholderText("e.g. 2450.50");
    fireEvent.change(buyPriceInput, { target: { value: "2800" } });

    // Save button should now be enabled
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        symbol: "RELIANCE",
        exchange: "NSE",
        qty: "25",
        avgPrice: "2800",
        dematId: "demat-1",
      })
    );
  });

  it("supports editing existing stock lot", () => {
    const initialLot = {
      id: "st-99",
      symbol: "INFY",
      exchange: "NSE",
      dematId: "demat-2",
      qty: "50",
      avgPrice: "1450.00",
      currentPrice: "1620.00",
      buyDate: "2024-01-15",
      owner: "self",
      notes: "Long term IT bet",
    };

    const onSave = vi.fn();
    render(<StockScripModal {...defaultProps} initial={initialLot} onSave={onSave} />);

    expect(screen.getByText("Edit Stock Scrip")).toBeInTheDocument();
    const symbolInput = screen.getByPlaceholderText(/e\.g\. RELIANCE, TCS, INFY/i) as HTMLInputElement;
    expect(symbolInput.value).toBe("INFY");

    const saveBtn = screen.getByRole("button", { name: /Save Changes/i });
    expect(saveBtn).not.toBeDisabled();

    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        symbol: "INFY",
        qty: "50",
        avgPrice: "1450",
      })
    );
  });
});
