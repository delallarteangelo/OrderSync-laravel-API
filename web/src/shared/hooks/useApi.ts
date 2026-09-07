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
} from "@/shared/api/catalog";
import {
  adjustStock,
  listInventory,
  listLowStock,
  listMovements,
  restock,
  type MovementFilters,
} from "@/shared/api/inventory";
import { getOrder, listOrders, transitionOrder, type OrderFilters } from "@/shared/api/orders";
import { finalizeSale, listSales } from "@/shared/api/pos";
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
import { getInventoryReport, getOrdersReport, getSalesReport, type ReportRange } from "@/shared/api/reports";

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

// ---- Dashboard ----
export const useDashboard = () =>
  useQuery({ queryKey: qk.dashboard, queryFn: getDashboard, staleTime: 15_000 });

// ---- Catalog ----
export const useProducts = (filters?: ProductFilters) =>
  useQuery({ queryKey: qk.products(filters), queryFn: () => listProducts(filters) });

export const useProduct = (id: string | undefined) =>
  useQuery({ queryKey: qk.product(id ?? ""), queryFn: () => getProduct(id!), enabled: !!id });

export const useProductByBarcode = () => useMutation({ mutationFn: getProductByBarcode });

export const useCategories = () =>
  useQuery({ queryKey: qk.categories, queryFn: listCategories });

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: qk.inventory });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}
export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(vars.id, vars.payload),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: qk.product(vars.id) });
      qc.invalidateQueries({ queryKey: qk.inventory });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}
export function useDeactivateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: qk.inventory });
    },
  });
}
export function useReactivateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reactivateProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: qk.inventory });
    },
  });
}
export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
  });
}
export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; payload: Parameters<typeof updateCategory>[1] }) =>
      updateCategory(vars.id, vars.payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
  });
}
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.categories }),
  });
}

// ---- Inventory ----
export const useInventory = () => useQuery({ queryKey: qk.inventory, queryFn: listInventory });
export const useLowStock = () => useQuery({ queryKey: qk.lowStock, queryFn: listLowStock });
export const useMovements = (filters?: MovementFilters) =>
  useQuery({ queryKey: qk.movements(filters), queryFn: () => listMovements(filters) });

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.inventory });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: qk.lowStock });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

export function useRestock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: restock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.inventory });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: qk.lowStock });
      qc.invalidateQueries({ queryKey: qk.dashboard });
    },
  });
}

// ---- Orders ----
export const useOrders = (filters?: OrderFilters) =>
  useQuery({ queryKey: qk.orders(filters), queryFn: () => listOrders(filters) });
export const useOrder = (id: string | undefined) =>
  useQuery({ queryKey: qk.order(id ?? ""), queryFn: () => getOrder(id!), enabled: !!id });

export function useTransitionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; next: Parameters<typeof transitionOrder>[1]; note?: string }) =>
      transitionOrder(v.id, v.next, v.note),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: qk.order(v.id) });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: qk.inventory });
    },
  });
}

// ---- POS ----
export const useSales = () => useQuery({ queryKey: qk.sales, queryFn: listSales });
export function useFinalizeSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: finalizeSale,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.sales });
      qc.invalidateQueries({ queryKey: qk.inventory });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: qk.dashboard });
      qc.invalidateQueries({ queryKey: qk.lowStock });
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
