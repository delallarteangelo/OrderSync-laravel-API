import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAnalyticsOverview, getDashboard } from "@/shared/api/reports";
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
  createAiKnowledge,
  deactivateAiKnowledge,
  deleteAiKnowledge,
  getAiSupportSettings,
  getAiUsage,
  listAiKnowledge,
  listSupportHandoffs,
  resolveSupportHandoff,
  updateAiSupportSettings,
  type KnowledgeInput,
} from "@/shared/api/aiSupport";
import type { AiSupportSettings } from "@/shared/types/aiSupport";
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
import {
  getNotificationPreferences,
  listMessages,
  listNotifications,
  listThreads,
  markAllNotificationsRead,
  markNotificationRead,
  markThreadRead,
  sendMessage,
  updateNotificationPreferences,
} from "@/shared/api/messages";
import type { NotificationPreferences } from "@/shared/types/messaging";
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
  dashboard: (businessId: string) => ["tenant", businessId, "dashboard"] as const,
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
  threads: (businessId: string) => ["tenant", businessId, "threads"] as const,
  messages: (businessId: string, threadId: string) =>
    ["tenant", businessId, "threads", threadId, "messages"] as const,
  notifications: (businessId: string) => ["tenant", businessId, "notifications"] as const,
  notificationPreferences: (businessId: string) =>
    ["tenant", businessId, "notification-preferences"] as const,
  aiKnowledge: (businessId: string) => ["tenant", businessId, "ai", "knowledge"] as const,
  aiSettings: (businessId: string) => ["tenant", businessId, "ai", "settings"] as const,
  aiUsage: (businessId: string) => ["tenant", businessId, "ai", "usage"] as const,
  aiHandoffs: (businessId: string) => ["tenant", businessId, "ai", "handoffs"] as const,
  users: ["users"] as const,
  user: (id: string) => ["user", id] as const,
  settings: (businessId: string) => ["tenant", businessId, "settings"] as const,
  reportSales: (businessId: string, r?: ReportRange) =>
    ["tenant", businessId, "reports", "sales", r ?? {}] as const,
  reportOrders: (businessId: string, r?: ReportRange) =>
    ["tenant", businessId, "reports", "orders", r ?? {}] as const,
  reportInventory: (businessId: string, r?: Omit<ReportRange, "bucket">) =>
    ["tenant", businessId, "reports", "inventory", r ?? {}] as const,
  reportOverview: (businessId: string, r?: Omit<ReportRange, "bucket">) =>
    ["tenant", businessId, "reports", "overview", r ?? {}] as const,
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
export const useDashboard = () => {
  const businessId = useBusinessId();
  return useQuery({ queryKey: qk.dashboard(businessId), queryFn: getDashboard, staleTime: 15_000 });
};

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
      qc.invalidateQueries({ queryKey: qk.dashboard(businessId) });
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
      qc.invalidateQueries({ queryKey: qk.dashboard(businessId) });
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
      qc.invalidateQueries({ queryKey: qk.dashboard(businessId) });
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
      qc.invalidateQueries({ queryKey: qk.dashboard(businessId) });
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
    refetchInterval: 15_000,
  });
};
export const useOrder = (id: string | undefined) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: tenantQk.order(businessId, id ?? ""),
    queryFn: () => getOrder(id!),
    enabled: !!id,
    refetchInterval: 15_000,
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
      qc.invalidateQueries({ queryKey: qk.dashboard(businessId) });
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
      qc.invalidateQueries({ queryKey: qk.dashboard(businessId) });
    },
  });
}

// ---- Messages ----
export const useThreads = () => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: qk.threads(businessId),
    queryFn: listThreads,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
  });
};
export const useMessages = (threadId: string | undefined) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: qk.messages(businessId, threadId ?? ""),
    queryFn: () => listMessages(threadId!),
    enabled: !!threadId,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
  });
};
export function useSendMessage(threadId: string) {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: (body: string) => sendMessage(threadId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.messages(businessId, threadId) });
      qc.invalidateQueries({ queryKey: qk.threads(businessId) });
    },
  });
}
export function useMarkThreadRead() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: markThreadRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.threads(businessId) }),
  });
}

export function useNotifications() {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: qk.notifications(businessId),
    queryFn: listNotifications,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
  });
}

export function useMarkNotificationRead() {
  const businessId = useBusinessId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications(businessId) }),
  });
}

export function useMarkAllNotificationsRead() {
  const businessId = useBusinessId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.notifications(businessId) }),
  });
}

export function useNotificationPreferences() {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: qk.notificationPreferences(businessId),
    queryFn: getNotificationPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const businessId = useBusinessId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (preferences: NotificationPreferences) =>
      updateNotificationPreferences(preferences),
    onSuccess: (preferences) =>
      qc.setQueryData(qk.notificationPreferences(businessId), preferences),
  });
}

// ---- AI support ----
export function useAiKnowledge() {
  const businessId = useBusinessId();
  return useQuery({ queryKey: qk.aiKnowledge(businessId), queryFn: listAiKnowledge });
}

export function useCreateAiKnowledge() {
  const businessId = useBusinessId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: KnowledgeInput) => createAiKnowledge(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.aiKnowledge(businessId) }),
  });
}

export function useDeactivateAiKnowledge() {
  const businessId = useBusinessId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deactivateAiKnowledge,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.aiKnowledge(businessId) }),
  });
}

export function useDeleteAiKnowledge() {
  const businessId = useBusinessId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteAiKnowledge,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.aiKnowledge(businessId) }),
  });
}

export function useAiSupportSettings() {
  const businessId = useBusinessId();
  return useQuery({ queryKey: qk.aiSettings(businessId), queryFn: getAiSupportSettings });
}

export function useUpdateAiSupportSettings() {
  const businessId = useBusinessId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      settings: Pick<
        AiSupportSettings,
        | "assistantEnabled"
        | "dailyCustomerRequestLimit"
        | "monthlyBusinessRequestLimit"
        | "maximumQuestionCharacters"
      >,
    ) => updateAiSupportSettings(settings),
    onSuccess: (settings) => qc.setQueryData(qk.aiSettings(businessId), settings),
  });
}

export function useAiUsage() {
  const businessId = useBusinessId();
  return useQuery({ queryKey: qk.aiUsage(businessId), queryFn: getAiUsage });
}

export function useSupportHandoffs() {
  const businessId = useBusinessId();
  return useQuery({ queryKey: qk.aiHandoffs(businessId), queryFn: listSupportHandoffs });
}

export function useResolveSupportHandoff() {
  const businessId = useBusinessId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resolveSupportHandoff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.aiHandoffs(businessId) });
      qc.invalidateQueries({ queryKey: qk.threads(businessId) });
    },
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
export const useSettings = () => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: qk.settings(businessId),
    queryFn: getSettings,
    enabled: businessId !== "no-business",
  });
};
export function useUpdateSettings() {
  const qc = useQueryClient();
  const businessId = useBusinessId();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (settings) => {
      qc.setQueryData(qk.settings(businessId), settings);
      const { user, accessToken, setSession } = useAuthStore.getState();
      if (user?.business?.id === businessId && accessToken) {
        setSession({
          accessToken,
          user: { ...user, business: { ...user.business, name: settings.storeName } },
        });
      }
    },
  });
}

// ---- Reports ----
export const useSalesReport = (range?: ReportRange) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: qk.reportSales(businessId, range),
    queryFn: () => getSalesReport(range),
  });
};
export const useOrdersReport = (range?: ReportRange) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: qk.reportOrders(businessId, range),
    queryFn: () => getOrdersReport(range),
  });
};
export const useInventoryReport = (range?: Omit<ReportRange, "bucket">) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: qk.reportInventory(businessId, range),
    queryFn: () => getInventoryReport(range),
  });
};
export const useAnalyticsOverview = (range?: Omit<ReportRange, "bucket">) => {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: qk.reportOverview(businessId, range),
    queryFn: () => getAnalyticsOverview(range),
  });
};
