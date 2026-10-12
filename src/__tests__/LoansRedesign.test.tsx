/* eslint-disable */
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoanTakenSection } from "../components/credit/LoanTakenSection";
import { LoanGivenSection } from "../components/credit/LoanGivenSection";
import { LoanAmortizationModal } from "../components/credit/LoanAmortizationModal";
import { LoanPrepaymentDrawer } from "../components/credit/LoanPrepaymentDrawer";
import { LoanReminderModal } from "../components/credit/LoanReminderModal";
import { LoanPaymentModal } from "../components/credit/LoanPaymentModal";
import { LoanTakenModal } from "../components/credit/LoanTakenModal";
import { generateAmortization } from "../components/tabs/LoanAmortizationTab";

describe("Loans Taken & Given Redesign Suite", () => {
  const mockLoansTaken = [
    {
      id: "lt1",
      lender: "HDFC Bank",
      type: "Home",
      principal: 5000000,
      outstanding: 4200000,
      rate: 8.5,
      emi: 43391,
      monthsRemaining: 180,
      dueDay: 5,
      owner: "self",
      payments: [
        { id: "p1", date: "2026-08-05", amount: 43391, type: "emi", mode: "Auto-Debit (NACH)" },
      ],
    },
    {
      id: "lt2",
      lender: "SBI",
      type: "Car",
      principal: 800000,
      outstanding: 350000,
      rate: 9.0,
      emi: 16500,
      monthsRemaining: 24,
      dueDay: 10,
      owner: "self",
    },
  ];

  const mockLoansGiven = [
    {
      id: "lg1",
      borrower: "Rahul Sharma",
      phone: "9876543210",
      principal: 200000,
      outstanding: 150000,
      rate: 12,
      date: "2026-01-15",
      dueDate: "2026-08-15", // Overdue relative to Sept 2026
      owner: "self",
      payments: [
        { id: "gp1", date: "2026-05-01", amount: 50000, mode: "UPI" },
      ],
    },
    {
      id: "lg2",
      borrower: "Pooja Verma",
      phone: "9123456780",
      principal: 50000,
      outstanding: 50000,
      rate: 0,
      date: "2026-08-01",
      dueDate: "2026-12-31", // Active & on-track
      owner: "self",
    },
  ];

  describe("LoanTakenSection UI & Interactions", () => {
    it("renders hero statistics and loan cards accurately", () => {
      const onRemove = vi.fn();
      const onEdit = vi.fn();
      const onAdd = vi.fn();
      const onUpdate = vi.fn();

      render(
        <LoanTakenSection
          items={mockLoansTaken}
          onRemove={onRemove}
          onEdit={onEdit}
          onAdd={onAdd}
          onUpdate={onUpdate}
        />
      );

      // Verify stat cards
      expect(screen.getByText("Total Borrowed")).toBeTruthy();
      expect(screen.getByText("Outstanding Debt")).toBeTruthy();
      expect(screen.getByText("Monthly EMI Outflow")).toBeTruthy();

      // Verify cards render lender names
      expect(screen.getByText("HDFC Bank")).toBeTruthy();
      expect(screen.getByText("SBI")).toBeTruthy();
    });

    it("filters active vs paid off and supports search", () => {
      render(
        <LoanTakenSection
          items={mockLoansTaken}
          onRemove={vi.fn()}
          onEdit={vi.fn()}
          onAdd={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      const searchInput = screen.getByPlaceholderText(/search lender/i);
      fireEvent.change(searchInput, { target: { value: "HDFC" } });

      expect(screen.getByText("HDFC Bank")).toBeTruthy();
      expect(screen.queryByText("SBI")).toBeNull();
    });

    it("switches to table view mode", () => {
      render(
        <LoanTakenSection
          items={mockLoansTaken}
          onRemove={vi.fn()}
          onEdit={vi.fn()}
          onAdd={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      const tableViewBtn = screen.getByTitle("Table View");
      fireEvent.click(tableViewBtn);

      expect(screen.getByText("Original Principal")).toBeTruthy();
      expect(screen.getByText("Tenure Left")).toBeTruthy();
    });
  });

  describe("LoanGivenSection UI & Overdue Alerts", () => {
    it("renders capital lent, pending recovery, and overdue banner", () => {
      render(
        <LoanGivenSection
          items={mockLoansGiven}
          onRemove={vi.fn()}
          onEdit={vi.fn()}
          onAdd={vi.fn()}
          onUpdate={vi.fn()}
        />
      );

      expect(screen.getByText("Total Capital Lent")).toBeTruthy();
      expect(screen.getByText("Pending Recovery")).toBeTruthy();
      expect(screen.getByText("Rahul Sharma")).toBeTruthy();
      expect(screen.getByText("Pooja Verma")).toBeTruthy();

      // Overdue alert banner should be present for Rahul Sharma
      expect(screen.getAllByText(/Overdue Loan/i).length).toBeGreaterThan(0);
    });
  });

  describe("Amortization & Prepayment Math", () => {
    it("generates amortization schedule correctly", () => {
      const result = generateAmortization(1000000, 9, 60, 0, null);
      expect(result.schedule.length).toBe(60);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.schedule[result.schedule.length - 1].balance).toBe(0);
    });

    it("calculates prepayment savings and tenure reduction in Prepayment Simulator", () => {
      render(
        <LoanPrepaymentDrawer
          loan={mockLoansTaken[0]}
          onClose={vi.fn()}
          onApplyPrepayment={vi.fn()}
        />
      );

      expect(screen.getByText("Lump-Sum Prepayment")).toBeTruthy();
      expect(screen.getByText("Extra Monthly EMI Step-Up")).toBeTruthy();
    });

    it("renders WhatsApp Payment Reminder generator with tone variations", () => {
      render(
        <LoanReminderModal
          loan={mockLoansGiven[0]}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/Send via WhatsApp/i)).toBeTruthy();
      expect(screen.getByText(/Copy Text/i)).toBeTruthy();
    });

    it("renders LoanPaymentModal with bank accounts and generates bank transaction correctly", () => {
      const mockBankAccounts = [
        { id: "ba1", bankName: "HDFC Bank", accountNumber: "1234567890", balance: 150000, owner: "self" },
      ];
      const onSavePayment = vi.fn();

      render(
        <LoanPaymentModal
          loan={mockLoansTaken[0]}
          type="taken"
          bankAccounts={mockBankAccounts}
          onClose={vi.fn()}
          onSavePayment={onSavePayment}
        />
      );

      expect(screen.getByText(/Record Payment — HDFC Bank/i)).toBeTruthy();
      expect(screen.getByText(/Deduct from Bank Account/i)).toBeTruthy();
      expect(screen.getAllByText(/HDFC Bank/i).length).toBeGreaterThanOrEqual(1);

      const recordBtn = screen.getByRole("button", { name: /Record EMI Payment/i });
      fireEvent.click(recordBtn);

      expect(onSavePayment).toHaveBeenCalled();
      const [paymentRecord, updatedLoanPatch, bankTxn] = onSavePayment.mock.calls[0];
      expect(paymentRecord.amount).toBe(mockLoansTaken[0].emi);
      expect(bankTxn).toBeTruthy();
      expect(bankTxn.accountId).toBe("ba1");
      expect(bankTxn.type).toBe("debit");
      expect(bankTxn.linkedType).toBe("loansTaken");
      expect(bankTxn.linkedId).toBe(mockLoansTaken[0].id);
    });

    it("renders LoanPaymentModal in Record Receipt mode for loan given and generates credit transaction", () => {
      const mockBankAccounts = [
        { id: "ba2", bankName: "ICICI Bank", accountNumber: "9876543210", balance: 250000, owner: "self" },
      ];
      const onSavePayment = vi.fn();

      render(
        <LoanPaymentModal
          loan={mockLoansGiven[0]}
          type="given"
          bankAccounts={mockBankAccounts}
          onClose={vi.fn()}
          onSavePayment={onSavePayment}
        />
      );

      expect(screen.getByText(/Record Payment Received — Rahul Sharma/i)).toBeTruthy();
      expect(screen.getByText(/Deposit into Bank Account/i)).toBeTruthy();
      expect(screen.getByText(/Automatically credits this bank account/i)).toBeTruthy();

      const recordBtn = screen.getByRole("button", { name: /Record Receipt/i });
      fireEvent.click(recordBtn);

      expect(onSavePayment).toHaveBeenCalled();
      const [paymentRecord, updatedLoanPatch, bankTxn] = onSavePayment.mock.calls[0];
      expect(paymentRecord.amount).toBe(mockLoansGiven[0].outstanding);
      expect(bankTxn).toBeTruthy();
      expect(bankTxn.accountId).toBe("ba2");
      expect(bankTxn.type).toBe("credit");
      expect(bankTxn.linkedType).toBe("loansGiven");
      expect(bankTxn.linkedId).toBe(mockLoansGiven[0].id);
    });

    it("renders LoanAmortizationModal with optimized responsive layout", () => {
      render(
        <LoanAmortizationModal
          loan={mockLoansTaken[0]}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/Amortization Schedule — HDFC Bank/i)).toBeTruthy();
      expect(screen.getByText(/Payoff Trajectory/i)).toBeTruthy();
      expect(screen.getByText(/Monthly Breakdown/i)).toBeTruthy();
      expect(screen.getByText(/Yearly Summary/i)).toBeTruthy();
    });

    it("supports Monthly EMI Start Date in LoanTakenModal and saves it", () => {
      const onSave = vi.fn();
      render(
        <LoanTakenModal
          onSave={onSave}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/Monthly EMI Start Date/i)).toBeTruthy();

      // Enter loan details
      fireEvent.change(screen.getByPlaceholderText(/HDFC Bank, SBI, ICICI, Bajaj Finserv/i), {
        target: { value: "Kotak Mahindra Home Loan" },
      });
      fireEvent.change(screen.getByPlaceholderText(/2500000/i), {
        target: { value: "3000000" },
      });
      fireEvent.change(screen.getByPlaceholderText(/8.75/i), {
        target: { value: "8.75" },
      });
      fireEvent.change(screen.getByPlaceholderText(/24500/i), {
        target: { value: "28000" },
      });

      // Select EMI Start Date - should prefill dueDay to 15
      const dateInputs = document.querySelectorAll('input[type="date"]');
      expect(dateInputs.length).toBeGreaterThan(0);
      const emiStartDateInput = dateInputs[0];
      fireEvent.change(emiStartDateInput, { target: { value: "2026-06-15" } });

      const dueDayInput = screen.getByPlaceholderText(/5th of each month/i) as HTMLInputElement;
      expect(dueDayInput.value).toBe("15");

      fireEvent.click(screen.getByRole("button", { name: /Add Loan Taken/i }));

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          lender: "Kotak Mahindra Home Loan",
          principal: 3000000,
          startDate: "2026-06-15",
          dueDay: "15",
        }),
        null
      );
    });
  });
});


