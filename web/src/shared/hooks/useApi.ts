import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboard } from "@/shared/api/reports";
import {
  createCategory,
  createProduct,
  deactivateProduct,
  deleteCategory,
  listCategories,
  listProducts,
  reactivateProduct,
  updateCategory,
  updateProduct,
  type ProductFilters,
  getProduct,
  getProductByBarcode,
  uploadProductImage,
} from "@/shared/api/catalog";
import { useAuthStore } from "@/app/stores/authStore";
import {
  adjustStock,
  listInventory,
  listLowStock,
  listMovements,
  restock,
  type MovementFilters,
} from "@/shared/api/inventory";
import {
  cancelCustomerOrder,
  getOrder,
  getStorefront,
  listCustomerOrders,
  listOrders,
  listStorefronts,
  placeCustomerOrder,
  transitionOrder,
  type OrderFilters,
} from "@/shared/api/orders";
import { finalizeSale, getSale, listSales } from "@/shared/api/pos";
import { listMessages, listThreads, markThreadRead, sendMessage } from "@/shared/api/messages";
import {
  createUser,
  deactivateUser,
  getUser,
  listUsers,
  resetUserPassword,
  updateUser,
} from "@/shared/api/users";
import { getSettings, updateSettings } from "@/shared/api/settings";
import {
  getInventoryReport,
  getOrdersReport,
  getSalesReport,
  type ReportRange,
} from "@/shared/api/reports";

// ---- query keys ----
export const qk = {
  dashboard: ["dashboard"] as const,
  products: (f?: ProductFilters) => ["products", f ?? {}] as const,
  product: (id: string) => ["product", id] as const,
  productByBarcode: (code: string) => ["product", "barcode", code] as const,
  categories: ["categories"] as const,
  inventory: ["inventory"] as const,
  lowStock: ["inventory", "low-stock"] as const,
  movements: (f?: MovementFilters) => ["movements", f ?? {}] as const,
  orders: (f?: OrderFilters) => ["orders", f ?? {}] as const,
  order: (id: string) => ["order", id] as const,
  sales: ["pos", "sales"] as const,
  threads: ["threads"] as const,
  messages: (threadId: string) => ["messages", threadId] as const,
  users: ["users"] as const,
  user: (id: string) => ["user", id] as const,
  settings: ["settings"] as const,
  reportSales: (r?: ReportRange) => ["reports", "sales", r ?? {}] as const,
  reportOrders: (r?: ReportRange) => ["reports", "orders", r ?? {}] as const,
  reportInventory: ["reports", "inventory"] as const,
};

export const tenantQk = {
  root: (businessId: string) => ["tenant", businessId] as const,
  products: (businessId: string, f?: ProductFilters) =>
    ["tenant", businessId, "products", f ?? {}] as const,
  product: (businessId: string, id: string) => ["tenant", businessId, "product", id] as const,
  categories: (businessId: string) => ["tenant", businessId, "categories"] as const,
  inventory: (businessId: string) => ["tenant", businessId, "inventory"] as const,
  lowStock: (businessId: string) => ["tenant", businessId, "inventory", "low-stock"] as const,
  movements: (businessId: string, f?: MovementFilters) =>
    ["tenant", businessId, "movements", f ?? {}] as const,
  sales: (businessId: string) => ["tenant", businessId, "pos", "sales"] as const,
  sale: (businessId: string, id: string) => ["tenant", businessId, "pos", "sale", id] as const,
  orders: (businessId: string, f?: OrderFilters) =>
    ["tenant", businessId, "orders", f ?? {}] as const,
  order: (businessId: string, id: string) => ["tenant", businessId, "order", id] as const,
  customerOrders: (businessId: string) => ["tenant", businessId, "customer", "orders"] as const,
};

export const storefrontQk = {
  all: ["storefronts"] as const,
  detail: (slug: string) => ["storefront", slug] as const,
};

function useBusinessId(): string {
  return useAuthStore((state) => state.user?.business?.id ?? "no-business");
}

// ---- Dashboard ----
export const useDashboard = () =>
  useQuery({ queryKey: qk.dashboard, queryFn: getDashboard, staleTime: 15_000 });

// ---- Catalog ----
export const useProducts = (filters?: ProductFilters) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: tenantQk.products(businessId, filters),
    queryFn: () => listProducts(filters),
  });
};

export const useProduct = (id: string | undefined) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: tenantQk.product(businessId, id ?? ""),
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });
};

export const useProductByBarcode = () => useMutation({ mutationFn: getProductByBarcode });

export const useCategories = () => {
  const businessId = useBusinessId();
  return useQuery({ queryKey: tenantQk.categories(businessId), queryFn: listCategories });
};

export function useCreateProduct() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantQk.root(businessId) });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}
export function useUpdateProduct() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: (vars: { id: string; payload: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(vars.id, vars.payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: tenantQk.root(businessId) });
      qc.invalidateQueries({ queryKey: tenantQk.product(businessId, vars.id) });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}
export function useDeactivateProduct() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: deactivateProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantQk.root(businessId) });
    },
  });
}
export function useReactivateProduct() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: reactivateProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantQk.root(businessId) });
    },
  });
}
export function useCreateCategory() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantQk.root(businessId) }),
  });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: (vars: { id: string; payload: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(vars.id, vars.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantQk.root(businessId) }),
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantQk.root(businessId) }),
  });
}

// ---- Inventory ----
export const useInventory = () => {
  const businessId = useBusinessId();
  return useQuery({ queryKey: tenantQk.inventory(businessId), queryFn: listInventory });
};
export const useLowStock = () => {
  const businessId = useBusinessId();
  return useQuery({ queryKey: tenantQk.lowStock(businessId), queryFn: listLowStock });
};
export const useMovements = (filters?: MovementFilters) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: tenantQk.movements(businessId, filters),
    queryFn: () => listMovements(filters),
  });
};

export function useAdjustStock() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantQk.root(businessId) });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useRestock() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: restock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantQk.root(businessId) });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useUploadProductImage() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) =>
      uploadProductImage(productId, file),
    onSuccess: (_product, variables) => {
      qc.invalidateQueries({ queryKey: tenantQk.root(businessId) });
      qc.invalidateQueries({ queryKey: tenantQk.product(businessId, variables.productId) });
    },
  });
}

// ---- Orders ----
export const useOrders = (filters?: OrderFilters) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: tenantQk.orders(businessId, filters),
    queryFn: () => listOrders(filters),
  });
};
export const useOrder = (id: string | undefined) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: tenantQk.order(businessId, id ?? ""),
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });
};

export function useTransitionOrder() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: (v: { id: string; next: Parameters<typeof transitionOrder>[1]; note?: string }) =>
      transitionOrder(v.id, v.next, v.note),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: tenantQk.root(businessId) });
      qc.invalidateQueries({ queryKey: tenantQk.order(businessId, v.id) });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export const useStorefronts = () =>
  useQuery({ queryKey: storefrontQk.all, queryFn: listStorefronts, staleTime: 60_000 });

export const useStorefront = (slug: string | undefined) =>
  useQuery({
    queryKey: storefrontQk.detail(slug ?? ""),
    queryFn: () => getStorefront(slug!),
    enabled: !!slug,
    staleTime: 15_000,
  });

export const useCustomerOrders = (enabled = true) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: tenantQk.customerOrders(businessId),
    queryFn: listCustomerOrders,
    enabled,
  });
};

export function usePlaceCustomerOrder() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: placeCustomerOrder,
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantQk.customerOrders(businessId) }),
  });
}

export function useCancelCustomerOrder() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => cancelCustomerOrder(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantQk.customerOrders(businessId) }),
  });
}

// ---- POS ----
export const useSales = () => {
  const businessId = useBusinessId();
  return useQuery({ queryKey: tenantQk.sales(businessId), queryFn: listSales });
};
export const useSale = (id: string | undefined) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: tenantQk.sale(businessId, id ?? ""),
    queryFn: () => getSale(id!),
    enabled: !!id,
  });
};
export function useFinalizeSale() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: finalizeSale,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tenantQk.root(businessId) });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

// ---- Messages ----
export const useThreads = () => useQuery({ queryKey: qk.threads, queryFn: listThreads });
export const useMessages = (threadId: string | undefined) =>
  useQuery({
    queryKey: qk.messages(threadId ?? ""),
    queryFn: () => listMessages(threadId!),
    enabled: !!threadId,
  });
export function useSendMessage(threadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => sendMessage(threadId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.messages(threadId) });
      qc.invalidateQueries({ queryKey: qk.threads });
    },
  });
}
export function useMarkThreadRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markThreadRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.threads }),
  });
}

// ---- Users ----
export const useUsers = () => useQuery({ queryKey: qk.users, queryFn: listUsers });
export const useUser = (id: string | undefined) =>
  useQuery({ queryKey: qk.user(id ?? ""), queryFn: () => getUser(id!), enabled: !!id });
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  });
}
export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; payload: Parameters<typeof updateUser>[1] }) =>
      updateUser(v.id, v.payload),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: qk.users });
      qc.invalidateQueries({ queryKey: qk.user(v.id) });
    },
  });
}
export function useDeactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.users }),
  });
}
export function useResetUserPassword() {
  return useMutation({ mutationFn: resetUserPassword });
}

// ---- Settings ----
export const useSettings = () => useQuery({ queryKey: qk.settings, queryFn: getSettings });
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.settings }),
  });
}

// ---- Reports ----
export const useSalesReport = (range?: ReportRange) =>
  useQuery({ queryKey: qk.reportSales(range), queryFn: () => getSalesReport(range) });
export const useOrdersReport = (range?: ReportRange) =>
  useQuery({ queryKey: qk.reportOrders(range), queryFn: () => getOrdersReport(range) });
export const useInventoryReport = () =>
  useQuery({ queryKey: qk.reportInventory, queryFn: getInventoryReport });
