import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderSyncLogo } from "../OrderSyncLogo";

describe("OrderSyncLogo", () => {
  it("uses the shared web branding asset", () => {
    render(<OrderSyncLogo />);

    expect(screen.getByRole("img", { name: "OrderSync logo" })).toHaveAttribute(
      "src",
      "/branding/OrderSync-Web-Logo.png",
    );
  });

  it("can be decorative beside visible brand text", () => {
    const { container } = render(<OrderSyncLogo decorative />);

    expect(container.querySelector("img")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
