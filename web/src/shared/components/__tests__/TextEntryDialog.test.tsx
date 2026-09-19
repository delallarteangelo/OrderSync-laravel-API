import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TextEntryDialog } from "../TextEntryDialog";

describe("TextEntryDialog", () => {
  it("requires and submits trimmed text", () => {
    const onSubmit = vi.fn();
    render(
      <TextEntryDialog
        open
        onOpenChange={vi.fn()}
        title="Reject payment proof?"
        label="Rejection reason"
        confirmLabel="Reject proof"
        onSubmit={onSubmit}
      />,
    );

    const submit = screen.getByRole("button", { name: "Reject proof" });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Rejection reason"), {
      target: { value: "  Reference does not match  " },
    });
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledWith("Reference does not match");
  });

  it("allows an empty optional reference", () => {
    const onSubmit = vi.fn();
    render(
      <TextEntryDialog
        open
        onOpenChange={vi.fn()}
        title="Mark paid?"
        label="Reference"
        required={false}
        confirmLabel="Mark paid"
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark paid" }));
    expect(onSubmit).toHaveBeenCalledWith("");
  });
});
