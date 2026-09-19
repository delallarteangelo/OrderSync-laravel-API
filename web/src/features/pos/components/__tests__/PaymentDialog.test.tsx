import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PaymentDialog } from "@/features/pos/components/PaymentDialog";

describe("PaymentDialog", () => {
  it("starts cash tender empty and applies quick-cash amounts from zero", async () => {
    const user = userEvent.setup();
    render(
      <PaymentDialog
        open
        onOpenChange={vi.fn()}
        total={70}
        submitting={false}
        onFinalize={vi.fn()}
      />,
    );

    const tendered = screen.getByRole("spinbutton", { name: /Tendered/i });
    expect(tendered).toHaveValue(null);
    expect(screen.getByRole("button", { name: "Confirm payment" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "+₱500" }));

    expect(tendered).toHaveValue(500);
    expect(screen.getByText("₱430.00")).toBeInTheDocument();
  });

  it("uses Exact for the total and resets tender when reopened", async () => {
    const user = userEvent.setup();
    const onFinalize = vi.fn();
    const props = {
      onOpenChange: vi.fn(),
      total: 70,
      submitting: false,
      onFinalize,
    };
    const { rerender } = render(<PaymentDialog open {...props} />);

    await user.click(screen.getByRole("button", { name: "Exact" }));
    expect(screen.getByRole("spinbutton", { name: /Tendered/i })).toHaveValue(70);
    await user.click(screen.getByRole("button", { name: "Confirm payment" }));
    expect(onFinalize).toHaveBeenCalledWith("CASH", 70, undefined);

    rerender(<PaymentDialog open={false} {...props} />);
    rerender(<PaymentDialog open {...props} />);
    expect(screen.getByRole("spinbutton", { name: /Tendered/i })).toHaveValue(null);
  });
});
