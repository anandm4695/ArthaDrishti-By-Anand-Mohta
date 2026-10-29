import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Modal } from "../components/ui/Modal";

describe("Modal focus & labelling", () => {
  it("focuses the first form field instead of the header close button", () => {
    render(
      <Modal title="Add Deposit" onClose={() => {}}>
        <input aria-label="Principal" />
      </Modal>
    );
    expect(screen.getByLabelText("Principal")).toHaveFocus();
  });

  it("names the dialog from its title even when the title is a React node", () => {
    render(
      <Modal title={<span>Edit Bond</span>} onClose={() => {}}>
        <p>body</p>
      </Modal>
    );
    expect(screen.getByRole("dialog", { name: "Edit Bond" })).toBeInTheDocument();
  });
});
