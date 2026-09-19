import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Product } from "@/shared/types/catalog";
import { PosProductTile } from "@/features/pos/components/PosProductTile";

const product: Product = {
  id: "product-1",
  sku: "MILK-1",
  name: "Powdered Milk",
  categoryId: "category-1",
  price: 30,
  stockOnHand: 5,
  lowStockThreshold: 2,
  isActive: true,
  imageUrl: "http://minigrocery.test/storage/product-images/1/milk.jpg",
};

describe("PosProductTile", () => {
  it("renders the product image and selects the product", () => {
    const onSelect = vi.fn();
    render(<PosProductTile product={product} categoryName="Milk" onSelect={onSelect} />);

    expect(screen.getByRole("presentation")).toHaveAttribute("src", product.imageUrl);
    fireEvent.click(screen.getByRole("button", { name: /Powdered Milk/i }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("falls back cleanly when the image cannot be loaded", () => {
    render(<PosProductTile product={product} categoryName="Milk" onSelect={vi.fn()} />);

    fireEvent.error(screen.getByRole("presentation"));

    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
  });
});
