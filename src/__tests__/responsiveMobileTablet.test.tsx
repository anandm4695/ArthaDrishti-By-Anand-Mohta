import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Auth from "../Auth";
import { MobileNav } from "../components/layout/MobileNav";
import { Modal } from "../components/ui/Modal";
import { Drawer } from "../components/ui/Drawer";
import { StatCard } from "../components/ui/StatCard";
import { ToastStack } from "../components/ui/Feedback";

describe("Responsive Mobile & Tablet Layout Integrity", () => {
  it("renders MobileNav with safe-area bottom nav and drawer markup", () => {
    const setTab = vi.fn();
    const setSubTab = vi.fn();

    const { container } = render(
      <MobileNav tab="analytics" setTab={setTab} setSubTab={setSubTab} />
    );

    expect(container.querySelector(".mobile-bottom-nav")).toBeTruthy();
    expect(container.textContent).toContain("Home");
    expect(container.textContent).toContain("Banks");
    expect(container.textContent).toContain("Stocks");
    expect(container.textContent).toContain("Credit");
    expect(container.textContent).toContain("More");
  });

  it("renders Modal with fluid responsive maxWidth constraint and safe-area footer padding", () => {
    const onClose = vi.fn();
    const { baseElement } = render(
      <Modal
        title="Add Bank Account"
        onClose={onClose}
        footer={<button>Save</button>}
      >
        <div>Account Form Content</div>
      </Modal>
    );

    const panel = baseElement.querySelector(".modal-panel") as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.style.maxWidth).toContain("100%");

    const footer = baseElement.querySelector(".modal-footer") as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.style.paddingBottom).toContain("safe-area-inset-bottom");
  });

  it("renders Drawer with safe-area footer padding", () => {
    const onClose = vi.fn();
    const { baseElement } = render(
      <Drawer
        title="Holding Details"
        onClose={onClose}
        footer={<button>Update</button>}
      >
        <div>Drawer Content</div>
      </Drawer>
    );

    const panel = baseElement.querySelector(".drawer-panel") as HTMLElement;
    expect(panel).toBeTruthy();

    const footer = baseElement.querySelector(".modal-footer") as HTMLElement;
    expect(footer).toBeTruthy();
    expect(footer.style.paddingBottom).toContain("safe-area-inset-bottom");
  });

  it("renders Auth with iOS zoom prevention and responsive demo access", () => {
    const onLogin = vi.fn();
    const { container } = render(<Auth onLogin={onLogin} />);

    expect(container.querySelector(".af-form-panel")).toBeTruthy();
    expect(container.querySelector(".af-card")).toBeTruthy();
    expect(container.querySelector(".af-demo-card")).toBeTruthy();
    expect(container.querySelector("#btn-explore-demo")).toBeTruthy();

    // Verify style tag contains 16px font-size to prevent iOS Safari auto-zoom
    // (the login screensaver preview may render its own <style> first, so check them all)
    const css = Array.from(container.querySelectorAll("style"))
      .map((s) => s.textContent)
      .join("\n");
    expect(css).toContain("font-size: 16px;");
  });

  it("renders StatCard with stat-card-value class and word break safety", () => {
    const { container } = render(
      <StatCard
        title="Total Wealth"
        value="₹1,24,50,000"
        icon={<span>₹</span>}
      />
    );

    const val = container.querySelector(".stat-card-value") as HTMLElement;
    expect(val).toBeTruthy();
    expect(val.style.overflowWrap).toBe("anywhere");
  });

  it("renders ToastStack with toast-stack-container class for mobile positioning above nav", () => {
    const toasts = [{ id: "t1", msg: "Data saved successfully", type: "success" as const }];
    const { baseElement } = render(<ToastStack toasts={toasts} />);

    const toastContainer = baseElement.querySelector(".toast-stack-container") as HTMLElement;
    expect(toastContainer).toBeTruthy();
    expect(toastContainer.textContent).toContain("Data saved successfully");
  });

  it("renders WorkspaceSidebar with sidebar-compact class when minimized", async () => {
    const { WorkspaceSidebar } = await import("../components/workspace/WorkspaceSidebar");
    const { container } = render(
      <WorkspaceSidebar
        tab="analytics"
        subTab={null}
        setTab={vi.fn()}
        setSubTab={vi.fn()}
        sidebarMinimized={true}
        setSidebarMinimized={vi.fn()}
        sidebarHovered={false}
        setSidebarHovered={vi.fn()}
        isSidebarCompact={true}
        collapsedGroups={{}}
        setCollapsedGroups={vi.fn()}
      />
    );

    const sidebar = container.querySelector(".app-sidebar");
    expect(sidebar).toBeTruthy();
    expect(sidebar?.classList.contains("sidebar-compact")).toBe(true);
  });
});
