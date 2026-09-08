import * as React from "react";
import { Link } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, PowerOff, Power } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/shared/types/catalog";
import { PageHeader } from "@/shared/components/PageHeader";
import { DataTable } from "@/shared/components/DataTable";
import { Money } from "@/shared/components/Money";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  useCategories,
  useDeactivateProduct,
  useProducts,
  useReactivateProduct,
} from "@/shared/hooks/useApi";
import { isApiError } from "@/shared/api/errors";
import { useRole } from "@/shared/hooks/useRole";

export function ProductListPage() {
  const productsQ = useProducts();
  const categoriesQ = useCategories();
  const deactivateM = useDeactivateProduct();
  const reactivateM = useReactivateProduct();
  const { canManageCatalog } = useRole();
  const products = productsQ.data ?? [];
  const categories = categoriesQ.data ?? [];
  const categoryName = React.useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name ?? "—",
    [categories],
  );
  const [category, setCategory] = React.useState<string>("ALL");
  const [activity, setActivity] = React.useState<"ALL" | "active" | "inactive">("ALL");
  const [stock, setStock] = React.useState<"ALL" | "ok" | "low" | "out">("ALL");

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      if (category !== "ALL" && p.categoryId !== category) return false;
      if (activity === "active" && !p.isActive) return false;
      if (activity === "inactive" && p.isActive) return false;
      if (stock === "out" && p.stockOnHand > 0) return false;
      if (stock === "low" && (p.stockOnHand === 0 || p.stockOnHand > p.lowStockThreshold))
        return false;
      if (stock === "ok" && p.stockOnHand <= p.lowStockThreshold) return false;
      return true;
    });
  }, [products, category, activity, stock]);

  const handleErr = (e: unknown, fallback: string) => {
    toast.error(isApiError(e) ? e.message : fallback);
  };

  const columns: ColumnDef<Product>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">
              SKU {row.original.sku} {row.original.barcode ? `· ${row.original.barcode}` : ""}
            </p>
          </div>
        ),
      },
      {
        id: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {categoryName(row.original.categoryId)}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => <Money value={row.original.price} className="font-medium" />,
      },
      {
        accessorKey: "stockOnHand",
        header: "Stock",
        cell: ({ row }) => {
          const p = row.original;
          if (p.stockOnHand === 0) return <Badge variant="destructive">Out</Badge>;
          if (p.stockOnHand <= p.lowStockThreshold)
            return <Badge variant="warning">{p.stockOnHand} (low)</Badge>;
          return <Badge variant="success">{p.stockOnHand}</Badge>;
        },
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "secondary" : "muted"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          canManageCatalog ? (
            <div className="flex items-center gap-1">
              <Button asChild size="sm" variant="ghost">
                <Link to={`/catalog/${row.original.id}/edit`}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
              {row.original.isActive ? (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={deactivateM.isPending}
                  onClick={() =>
                    deactivateM.mutate(row.original.id, {
                      onSuccess: () => toast.success(`${row.original.name} deactivated`),
                      onError: (e) => handleErr(e, "Failed to deactivate"),
                    })
                  }
                >
                  <PowerOff className="mr-1 h-3.5 w-3.5" />
                  Deactivate
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={reactivateM.isPending}
                  onClick={() =>
                    reactivateM.mutate(row.original.id, {
                      onSuccess: () => toast.success(`${row.original.name} reactivated`),
                      onError: (e) => handleErr(e, "Failed to reactivate"),
                    })
                  }
                >
                  <Power className="mr-1 h-3.5 w-3.5" />
                  Activate
                </Button>
              )}
            </div>
          ) : null,
      },
    ],
    [canManageCatalog, categoryName, deactivateM, reactivateM],
  );

  return (
    <>
      <PageHeader
        title="Catalog"
        description="All products available in your store."
        actions={
          canManageCatalog ? (
            <Button asChild>
              <Link to="/catalog/new">
                <Plus className="mr-1 h-4 w-4" />
                New product
              </Link>
            </Button>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={filtered}
        searchKey="name"
        searchPlaceholder="Search product name…"
        toolbar={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={activity} onValueChange={(v) => setActivity(v as typeof activity)}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stock} onValueChange={(v) => setStock(v as typeof stock)}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All stock</SelectItem>
                <SelectItem value="ok">In stock</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="out">Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </>
  );
}
