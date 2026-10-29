import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandKModal } from "../components/workspace/CommandKModal";
import { WorkspaceHeader } from "../components/workspace/WorkspaceHeader";
import { PrivacyProvider, usePrivacy } from "../context/PrivacyContext";
import { QuickAddModal } from "../components/modals/QuickAddModal";

describe("Senior UI/UX Enhancements & Executive OS Features", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("CommandKModal Executive Command Palette", () => {
    it("renders quick actions including Quick Add, Privacy Mode, and Theme toggle when query is empty", () => {
      const onSelectTab = vi.fn();
      const onClose = vi.fn();
      const onQuickAdd = vi.fn();
      const togglePrivacy = vi.fn();
      const toggleDarkMode = vi.fn();

      render(
        <CommandKModal
          isOpen={true}
          onClose={onClose}
          onSelectTab={onSelectTab}
          onQuickAdd={onQuickAdd}
          togglePrivacy={togglePrivacy}
          isPrivacyMode={false}
          toggleDarkMode={toggleDarkMode}
          isDarkMode={false}
        />
      );

      expect(screen.getByText("Quick Add Transaction")).toBeInTheDocument();
      expect(screen.getByText("Enable Privacy Mode (Mask Amounts)")).toBeInTheDocument();
      expect(screen.getByText("Switch to Dark Mode")).toBeInTheDocument();
    });

    it("triggers quick add callback and closes modal on click", () => {
      const onQuickAdd = vi.fn();
      const onClose = vi.fn();

      render(
        <CommandKModal
          isOpen={true}
          onClose={onClose}
          onSelectTab={vi.fn()}
          onQuickAdd={onQuickAdd}
        />
      );

      const addBtn = screen.getByText("Quick Add Transaction");
      fireEvent.click(addBtn);

      expect(onQuickAdd).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("filters commands effectively using keywords like 'expense' for Quick Add", () => {
      render(
        <CommandKModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectTab={vi.fn()}
          onQuickAdd={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText(/Type a command/i);
      fireEvent.change(input, { target: { value: "expense" } });

      expect(screen.getByText("Quick Add Transaction")).toBeInTheDocument();
    });

    it("filters financial calculators when searching by tool name like 'loan'", () => {
      render(
        <CommandKModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectTab={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText(/Type a command/i);
      fireEvent.change(input, { target: { value: "loan" } });

      expect(screen.getByText("EMI Loan Calculator")).toBeInTheDocument();
    });
  });

  describe("WorkspaceHeader UI & Privacy Mode Active Indicator", () => {
    it("renders '+ Add' quick action button and triggers onQuickAdd", () => {
      const onQuickAdd = vi.fn();

      render(
        <PrivacyProvider>
          <WorkspaceHeader
            tab="analytics"
            subTab={null}
            setTab={vi.fn()}
            greeting={{ title: "Welcome Anand", subtitle: "Financial Overview" }}
            search=""
            setSearch={vi.fn()}
            showSearch={false}
            setShowSearch={vi.fn()}
            searchResults={[]}
            setShowCmdPalette={vi.fn()}
            activeProfile="all"
            setActiveProfile={vi.fn()}
            familyProfiles={[]}
            showMobileSearch={false}
            setShowMobileSearch={vi.fn()}
            alertsMenuRef={{ current: null }}
            showAlerts={false}
            setShowAlerts={vi.fn()}
            alerts={[]}
            state={{}}
            updateDismissedAlerts={vi.fn()}
            darkMode={false}
            updateSettings={vi.fn()}
            exportJSON={vi.fn()}
            profileMenuRef={{ current: null }}
            showProfileMenu={false}
            setShowProfileMenu={vi.fn()}
            session={null}
            onSignOut={vi.fn()}
            onQuickAdd={onQuickAdd}
          />
        </PrivacyProvider>
      );

      const addBtn = screen.getByRole("button", { name: /Quick Add Transaction/i });
      expect(addBtn).toBeInTheDocument();
      fireEvent.click(addBtn);
      expect(onQuickAdd).toHaveBeenCalledTimes(1);
    });
  });

  describe("PrivacyContext Functional Updater", () => {
    function PrivacyTestHarness() {
      const { privacyMode, setPrivacyMode } = usePrivacy();
      return (
        <div>
          <span data-testid="status">{privacyMode ? "hidden" : "visible"}</span>
          <button data-testid="toggle-btn" onClick={() => setPrivacyMode((prev) => !prev)}>
            Toggle
          </button>
        </div>
      );
    }

    it("toggles privacyMode back and forth using functional updater without stale closures", () => {
      render(
        <PrivacyProvider>
          <PrivacyTestHarness />
        </PrivacyProvider>
      );

      const status = screen.getByTestId("status");
      const button = screen.getByTestId("toggle-btn");

      // Initial state is false (default when empty)
      expect(status.textContent).toBe("visible");

      fireEvent.click(button);
      expect(status.textContent).toBe("hidden");

      fireEvent.click(button);
      expect(status.textContent).toBe("visible");
    });
  });

  describe("QuickAddModal Integration", () => {
    it("submits valid transaction with amount, category, account, and note", async () => {
      const onSave = vi.fn();
      const onClose = vi.fn();
      const bankAccounts = [{ id: "acc-1", bankName: "HDFC Salary" }];

      render(
        <QuickAddModal
          onClose={onClose}
          onSave={onSave}
          bankAccounts={bankAccounts}
        />
      );

      const amountInput = screen.getByPlaceholderText("0");
      fireEvent.change(amountInput, { target: { value: "3500" } });

      const saveBtn = screen.getByText("Add Transaction");
      fireEvent.click(saveBtn);

      expect(onSave).toHaveBeenCalledTimes(1);
      const savedData = onSave.mock.calls[0][0];
      expect(savedData.amount).toBe("3500");
      expect(savedData.type).toBe("debit");
      expect(savedData.accountId).toBe("acc-1");
    });
  });
});
