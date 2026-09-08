import { http, HttpResponse } from "msw";
import { db, randomId, findUserByToken, tokenFromAuthHeader } from "../db";
import type { Product, Category } from "@/shared/types/catalog";

function requireUser(request: Request) {
  return findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")));
}

function requireAdmin(request: Request) {
  const u = requireUser(request);
  return u && u.role === "BUSINESS_OWNER" ? u : null;
}

export const catalogHandlers = [
  // PRODUCTS
  http.get("/api/v1/products", ({ request }) => {
    if (!requireUser(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const categoryId = url.searchParams.get("categoryId");
    const active = url.searchParams.get("active");
    let items = db.products;
    if (search) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.barcode?.toLowerCase().includes(search),
      );
    }
    if (categoryId) items = items.filter((p) => p.categoryId === categoryId);
    if (active === "true") items = items.filter((p) => p.isActive);
    if (active === "false") items = items.filter((p) => !p.isActive);
    return HttpResponse.json({ items, total: items.length });
  }),

  http.get("/api/v1/products/by-barcode/:code", ({ request, params }) => {
    if (!requireUser(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const code = String(params.code);
    const p = db.products.find((x) => x.barcode === code || x.sku === code);
    if (!p) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    return HttpResponse.json(p);
  }),

  http.get("/api/v1/products/:id", ({ request, params }) => {
    if (!requireUser(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const p = db.products.find((x) => x.id === params.id);
    if (!p) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    return HttpResponse.json(p);
  }),

  http.post("/api/v1/products", async ({ request }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const body = (await request.json()) as Partial<Product>;
    const fieldErrors: Record<string, string[]> = {};
    if (!body.sku) fieldErrors.sku = ["SKU is required"];
    else if (db.products.some((p) => p.sku === body.sku)) fieldErrors.sku = ["SKU already exists"];
    if (body.barcode && db.products.some((p) => p.barcode === body.barcode))
      fieldErrors.barcode = ["Barcode already exists"];
    if (!body.name) fieldErrors.name = ["Name is required"];
    if (!body.categoryId) fieldErrors.categoryId = ["Category is required"];
    if (Object.keys(fieldErrors).length) {
      return HttpResponse.json(
        { code: "VALIDATION", message: "Invalid product", fieldErrors },
        { status: 422 },
      );
    }
    const product: Product = {
      id: randomId("p"),
      sku: body.sku!,
      barcode: body.barcode,
      name: body.name!,
      description: body.description,
      categoryId: body.categoryId!,
      price: body.price ?? 0,
      costPrice: body.costPrice,
      stockOnHand: body.stockOnHand ?? 0,
      lowStockThreshold: body.lowStockThreshold ?? db.settings.lowStockDefault,
      isActive: body.isActive ?? true,
      imageUrl: body.imageUrl,
    };
    db.products = [product, ...db.products];
    return HttpResponse.json(product, { status: 201 });
  }),

  http.put("/api/v1/products/:id", async ({ request, params }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const body = (await request.json()) as Partial<Product>;
    const idx = db.products.findIndex((x) => x.id === params.id);
    if (idx === -1) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    const fieldErrors: Record<string, string[]> = {};
    if (body.sku && db.products.some((p, i) => p.sku === body.sku && i !== idx))
      fieldErrors.sku = ["SKU already exists"];
    if (body.barcode && db.products.some((p, i) => p.barcode === body.barcode && i !== idx))
      fieldErrors.barcode = ["Barcode already exists"];
    if (Object.keys(fieldErrors).length) {
      return HttpResponse.json(
        { code: "VALIDATION", message: "Invalid product", fieldErrors },
        { status: 422 },
      );
    }
    db.products[idx] = { ...db.products[idx], ...body };
    return HttpResponse.json(db.products[idx]);
  }),

  http.post("/api/v1/products/:id/deactivate", ({ request, params }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const idx = db.products.findIndex((p) => p.id === params.id);
    if (idx === -1) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    db.products[idx] = { ...db.products[idx], isActive: false };
    return HttpResponse.json(db.products[idx]);
  }),

  http.post("/api/v1/products/:id/reactivate", ({ request, params }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const idx = db.products.findIndex((p) => p.id === params.id);
    if (idx === -1) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    db.products[idx] = { ...db.products[idx], isActive: true };
    return HttpResponse.json(db.products[idx]);
  }),

  // CATEGORIES
  http.get("/api/v1/categories", ({ request }) => {
    if (!requireUser(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({ items: db.categories });
  }),

  http.post("/api/v1/categories", async ({ request }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const body = (await request.json()) as Partial<Category>;
    if (!body.name) {
      return HttpResponse.json(
        {
          code: "VALIDATION",
          message: "Name required",
          fieldErrors: { name: ["Name is required"] },
        },
        { status: 422 },
      );
    }
    const cat: Category = { id: randomId("cat"), name: body.name, iconUrl: body.iconUrl };
    db.categories = [...db.categories, cat];
    return HttpResponse.json(cat, { status: 201 });
  }),

  http.put("/api/v1/categories/:id", async ({ request, params }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const body = (await request.json()) as Partial<Category>;
    const idx = db.categories.findIndex((c) => c.id === params.id);
    if (idx === -1) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    db.categories[idx] = { ...db.categories[idx], ...body };
    return HttpResponse.json(db.categories[idx]);
  }),

  http.delete("/api/v1/categories/:id", ({ request, params }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const inUse = db.products.some((p) => p.categoryId === params.id);
    if (inUse) {
      return HttpResponse.json(
        { code: "IN_USE", message: "Category is in use by one or more products" },
        { status: 409 },
      );
    }
    db.categories = db.categories.filter((c) => c.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  // PRODUCT IMAGE UPLOAD (demo-mode placeholder)
  http.post("/api/v1/products/:id/image", ({ request, params }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const idx = db.products.findIndex((product) => product.id === params.id);
    if (idx === -1) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    db.products[idx] = {
      ...db.products[idx],
      imageUrl: `https://cdn.example.com/products/${randomId("img")}.jpg`,
    };
    return HttpResponse.json(db.products[idx]);
  }),
];
