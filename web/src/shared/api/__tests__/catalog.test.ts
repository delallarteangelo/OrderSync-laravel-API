import { describe, it, expect, beforeEach } from "vitest";
import { loginAsAdmin, logout } from "@/test/utils/login";
import {
  createCategory,
  createProduct,
  deactivateProduct,
  listCategories,
  listProducts,
  reactivateProduct,
  updateProduct,
} from "@/shared/api/catalog";
import { isApiError } from "@/shared/api/errors";

beforeEach(() => {
  logout();
});

describe("catalog api", () => {
  it("lists products after login", async () => {
    await loginAsAdmin();
    const items = await listProducts();
    expect(items.length).toBeGreaterThan(0);
  });

  it("creates a product and prevents duplicate SKU", async () => {
    await loginAsAdmin();
    const cats = await listCategories();
    const created = await createProduct({
      sku: "TEST-001",
      name: "Test Bar",
      categoryId: cats[0].id,
      price: 50,
      stockOnHand: 10,
      lowStockThreshold: 2,
      isActive: true,
    });
    expect(created.id).toBeDefined();
    expect(created.sku).toBe("TEST-001");

    await expect(
      createProduct({
        sku: "TEST-001",
        name: "Dup",
        categoryId: cats[0].id,
        price: 1,
      }),
    ).rejects.toSatisfy((e: unknown) => isApiError(e) && !!e.fieldErrors?.sku);
  });

  it("deactivates and reactivates a product", async () => {
    await loginAsAdmin();
    const all = await listProducts();
    const target = all[0];
    const off = await deactivateProduct(target.id);
    expect(off.isActive).toBe(false);
    const on = await reactivateProduct(target.id);
    expect(on.isActive).toBe(true);
  });

  it("updates a product price", async () => {
    await loginAsAdmin();
    const [p] = await listProducts();
    const updated = await updateProduct(p.id, { price: p.price + 7 });
    expect(updated.price).toBe(p.price + 7);
  });

  it("creates a category", async () => {
    await loginAsAdmin();
    const cat = await createCategory({ name: "New Aisle" });
    expect(cat.id).toBeDefined();
    expect(cat.name).toBe("New Aisle");
  });
});
