import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/shared/types/catalog";
import { PageHeader } from "@/shared/components/PageHeader";
import { DataTable } from "@/shared/components/DataTable";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useAdjustStock, useCategories, useInventory } from "@/shared/hooks/useApi";
import { isApiError } from "@/shared/api/errors";
import { useRole } from "@/shared/hooks/useRole";

function StockBadge({ p }: { p: Product }) {
  if (p.stockOnHand === 0) return <Badge variant="destructive">Out</Badge>;
  if (p.stockOnHand <= p.lowStockThreshold) return <Badge variant="warning">Low</Badge>;
  return <Badge variant="success">OK</Badge>;
}

export function InventoryListPage() {
  const inventoryQ = useInventory();
  const products = inventoryQ.data ?? [];
  const categories = useCategories().data ?? [];
  const categoryName = React.useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name ?? "—",
    [categories],
  );
  const [target, setTarget] = React.useState<Product | null>(null);
  const { canManageInventory } = useRole();

  const columns: ColumnDef<Product>[] = React.useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Product",
        cell: ({ row }) =>
          canManageInventory ? (
            <div>
              <p className="text-sm font-medium">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">SKU {row.original.sku}</p>
            </div>
          ) : null,
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
        accessorKey: "stockOnHand",
        header: "On hand",
        cell: ({ row }) => <span className="font-medium">{row.original.stockOnHand}</span>,
      },
      {
        accessorKey: "lowStockThreshold",
        header: "Threshold",
      },
      {
        id: "level",
        header: "Level",
        cell: ({ row }) => <StockBadge p={row.original} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button size="sm" variant="outline" onClick={() => setTarget(row.original)}>
            <Settings2 className="mr-1 h-3.5 w-3.5" />
            Adjust
          </Button>
        ),
      },
    ],
    [canManageInventory, categoryName],
  );

  return (
    <>
      <PageHeader title="Inventory" description="Live stock levels across all products." />
      <DataTable
        columns={columns}
        data={products}
        searchKey="name"
        searchPlaceholder="Search product…"
      />
      {canManageInventory && <AdjustStockDialog product={target} onClose={() => setTarget(null)} />}
    </>
  );
}

function AdjustStockDialog({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const adjustM = useAdjustStock();
  const [delta, setDelta] = React.useState<number>(0);
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (product) {
      setDelta(0);
      setNote("");
    }
  }, [product]);

  if (!product) return null;
  const invalidNote = note.trim().length < 3;
  const wouldBeNegative = product.stockOnHand + delta < 0;

  return (
    <Dialog open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock — {product.name}</DialogTitle>
          <DialogDescription>
            Current on hand: <strong>{product.stockOnHand}</strong>. Use negative numbers to deduct.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Delta</Label>
            <Input type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">
              Resulting on hand:{" "}
              <strong className={wouldBeNegative ? "text-rose-600" : undefined}>
                {product.stockOnHand + delta}
              </strong>
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>
              Note <span className="text-rose-600">(required)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Reason for the adjustment…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={delta === 0 || invalidNote || wouldBeNegative || adjustM.isPending}
            onClick={() => {
              adjustM.mutate(
                { productId: product.id, delta, reasonCode: "ADJUSTMENT", note: note.trim() },
                {
                  onSuccess: () => {
                    toast.success(`Stock for ${product.name} adjusted by ${delta}`);
                    onClose();
                  },
                  onError: (e) => toast.error(isApiError(e) ? e.message : "Failed to adjust stock"),
                },
              );
            }}
          >
            {adjustM.isPending ? "Applying…" : "Apply adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
