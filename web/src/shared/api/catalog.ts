import { http } from "./axios";
import type { Product, Category } from "@/shared/types/catalog";

export type ProductFilters = {
  search?: string;
  categoryId?: string;
  active?: boolean;
};

export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (typeof filters.active === "boolean") params.active = String(filters.active);
  const { data } = await http.get<{ items: Product[] }>("/products", { params });
  return data.items;
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await http.get<Product>(`/products/${id}`);
  return data;
}

export async function getProductByBarcode(code: string): Promise<Product> {
  const { data } = await http.get<Product>(`/products/by-barcode/${encodeURIComponent(code)}`);
  return data;
}

export async function createProduct(payload: Partial<Product>): Promise<Product> {
  const { data } = await http.post<Product>("/products", payload);
  return data;
}

export async function updateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  const { data } = await http.put<Product>(`/products/${id}`, payload);
  return data;
}

export async function deactivateProduct(id: string): Promise<Product> {
  const { data } = await http.post<Product>(`/products/${id}/deactivate`);
  return data;
}

export async function reactivateProduct(id: string): Promise<Product> {
  const { data } = await http.post<Product>(`/products/${id}/reactivate`);
  return data;
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await http.get<{ items: Category[] }>("/categories");
  return data.items;
}

export async function createCategory(payload: Partial<Category>): Promise<Category> {
  const { data } = await http.post<Category>("/categories", payload);
  return data;
}

export async function updateCategory(id: string, payload: Partial<Category>): Promise<Category> {
  const { data } = await http.put<Category>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  await http.delete(`/categories/${id}`);
}

export async function uploadProductImage(productId: string, file: File): Promise<Product> {
  const form = new FormData();
  form.append("image", file);
  const { data } = await http.post<Product>(`/products/${productId}/image`, form);
  return data;
}
