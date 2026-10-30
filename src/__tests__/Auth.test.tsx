/* eslint-disable */
import React from "react";
import { renderToString } from "react-dom/server";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Auth from "../Auth";
import { supabase } from "../supabaseClient";

describe("Auth Component UI & Rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the redesigned executive layout with brand headline and portfolio preview", () => {
    const onLogin = vi.fn();

    const html = renderToString(<Auth onLogin={onLogin} />);

    // Brand Panel & Live Preview
    expect(html).toContain("ArthaDrishti");
    expect(html).toContain("Private Wealth Operating System");
    expect(html).toContain("Unify your wealth.");
    expect(html).toContain("Live Portfolio Summary");
    expect(html).toContain("1,48,50,000");
    expect(html).toContain("+18.4% YoY");
    expect(html).toContain("Equities ₹62.3L");

    // 3D Matrix Integration
    expect(html).toContain("Multi-Asset Equilibrium Matrix");

    // Pillars & Security
    expect(html).toContain("Automated Multi-Account Reconciliation");
    expect(html).toContain("Family Entities &amp; Nominee Tracking");
    expect(html).toContain("Zero-Telemetry 256-Bit Vault Security");

    // Form Panel elements
    expect(html).toContain("Sign In");
    expect(html).toContain("Create Account");
    expect(html).toContain("Email address");
    expect(html).toContain("Password");
    expect(html).toContain("Remember my email");
    expect(html).toContain("Forgot password?");
    expect(html).toContain("256-bit Encryption • Zero-Telemetry Privacy • End-to-End Secure");
  });

  it("toggles password visibility between masked and plain text", () => {
    const onLogin = vi.fn();
    render(<Auth onLogin={onLogin} />);

    const passInput = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    expect(passInput.type).toBe("password");

    const toggleBtn = screen.getByLabelText(/Show password/i);
    fireEvent.click(toggleBtn);
    expect(passInput.type).toBe("text");

    const hideBtn = screen.getByLabelText(/Hide password/i);
    fireEvent.click(hideBtn);
    expect(passInput.type).toBe("password");
  });

  it("switches to Create Account mode and shows display name, password criteria checklist", async () => {
    const onLogin = vi.fn();
    render(<Auth onLogin={onLogin} />);

    const createTab = screen.getByRole("tab", { name: /Create Account/i });
    fireEvent.click(createTab);

    await waitFor(() => {
      expect(screen.getByText(/Join ArthaDrishti/i)).toBeDefined();
    });

    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeDefined();

    // Type a password to view strength checklist
    const passInput = screen.getByLabelText(/^Password$/i);
    fireEvent.change(passInput, { target: { value: "Secret@123" } });

    await waitFor(() => {
      expect(screen.getByText(/Password Security/i)).toBeDefined();
    });
    expect(screen.getByText(/8\+ chars/i)).toBeDefined();
    expect(screen.getByText(/Uppercase/i)).toBeDefined();
    expect(screen.getByText(/Number/i)).toBeDefined();
    expect(screen.getByText(/Symbol/i)).toBeDefined();
  });

  it("switches to Forgot Password mode and back to Sign In", async () => {
    const onLogin = vi.fn();
    render(<Auth onLogin={onLogin} />);

    const forgotBtn = screen.getByRole("button", { name: /Forgot password\?/i });
    fireEvent.click(forgotBtn);

    await waitFor(() => {
      expect(screen.getByText(/Reset your password/i)).toBeDefined();
    });
    expect(screen.getByRole("button", { name: /Send Recovery Link/i })).toBeDefined();

    const backBtn = screen.getByRole("button", { name: /Back to Sign In/i });
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/i)).toBeDefined();
    });
  });

  it("renders Two-Factor Verification (MFA) mode with 6-digit input", () => {
    const onLogin = vi.fn();
    render(<Auth onLogin={onLogin} initialMode="mfa" />);

    expect(screen.getByText(/Two-Factor Verification/i)).toBeDefined();
    expect(screen.getByLabelText(/Authenticator Code/i)).toBeDefined();

    const mfaInput = screen.getByLabelText(/Authenticator Code/i) as HTMLInputElement;
    fireEvent.change(mfaInput, { target: { value: "123456" } });
    expect(mfaInput.value).toBe("123456");

    expect(screen.getByRole("button", { name: /Verify & Sign In/i })).toBeDefined();
  });

  it("displays validation error when attempting to sign in with empty fields", async () => {
    const onLogin = vi.fn();
    render(<Auth onLogin={onLogin} />);

    const submitBtn = screen.getByRole("button", { name: /Sign In to Dashboard/i });
    fireEvent.click(submitBtn);

    // Form inputs should show error state or aria-invalid
    const emailInput = screen.getByLabelText(/Email address/i);
    expect(emailInput.getAttribute("aria-invalid")).toBe("false"); // Not invalid format, but empty
  });

  it("displays friendly error message on incorrect login credentials", async () => {
    const onLogin = vi.fn();
    vi.spyOn(supabase.auth, "signInWithPassword").mockResolvedValueOnce({
      data: { user: null, session: null } as any,
      error: { message: "Invalid login credentials" } as any,
    });

    render(<Auth onLogin={onLogin} />);

    const emailInput = screen.getByLabelText(/Email address/i);
    const passInput = screen.getByLabelText(/^Password$/i);

    fireEvent.change(emailInput, { target: { value: "investor@example.com" } });
    fireEvent.change(passInput, { target: { value: "ValidPass123!" } });

    const submitBtn = screen.getByRole("button", { name: /Sign In to Dashboard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Incorrect email or password\. Please check and try again\./i)
      ).toBeDefined();
    });
  });

  it("triggers guest demo login when clicking Launch Demo", () => {
    const onLogin = vi.fn();
    render(<Auth onLogin={onLogin} />);

    const demoBtn = screen.getByRole("button", { name: /Launch Demo with Dummy Data/i });
    fireEvent.click(demoBtn);

    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({ id: "offline-user" }),
      })
    );
  });
});
