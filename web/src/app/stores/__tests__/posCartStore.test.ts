import { beforeEach, describe, expect, it } from "vitest";
import { usePosCartStore } from "../posCartStore";

describe("POS cart tenant boundary", () => {
  beforeEach(() => {
    sessionStorage.clear();
    usePosCartStore.setState({ businessId: null, lines: [] });
  });

  it("preserves a same-tenant draft and clears it when the tenant changes", () => {
    usePosCartStore.getState().setBusiness("business-a");
    usePosCartStore.setState({
      lines: [
        {
          productId: "product-a",
          sku: "A-1",
          name: "Tenant A product",
          unitPrice: 10,
          quantity: 1,
        },
      ],
    });

    usePosCartStore.getState().setBusiness("business-a");
    expect(usePosCartStore.getState().lines).toHaveLength(1);

    usePosCartStore.getState().setBusiness("business-b");
    expect(usePosCartStore.getState()).toMatchObject({ businessId: "business-b", lines: [] });
  });
});
