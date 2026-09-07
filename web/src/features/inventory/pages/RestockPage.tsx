import * as React from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useProducts, useRestock } from "@/shared/hooks/useApi";
import { isApiError } from "@/shared/api/errors";

type Row = {
  key: string;
  productId: string;
  quantity: number;
  note?: string;
};

export function RestockPage() {
  const products = useProducts().data ?? [];
  const restockM = useRestock();

  const [rows, setRows] = React.useState<Row[]>([
    { key: crypto.randomUUID(), productId: products[0]?.id ?? "", quantity: 1 },
  ]);

  const addRow = () =>
    setRows((r) => [
      ...r,
      { key: crypto.randomUUID(), productId: products[0]?.id ?? "", quantity: 1 },
    ]);
  const updateRow = (key: string, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const removeRow = (key: string) => setRows((r) => r.filter((x) => x.key !== key));

  const submit = () => {
    const valid = rows.filter((r) => r.productId && r.quantity > 0);
    if (!valid.length) {
      toast.error("Add at least one valid line");
      return;
    }
    restockM.mutate(
      valid.map((r) => ({
        productId: r.productId,
        quantity: r.quantity,
        note: r.note,
      })),
      {
        onSuccess: () => {
          toast.success(`Restocked ${valid.length} line${valid.length === 1 ? "" : "s"}`);
          setRows([{ key: crypto.randomUUID(), productId: products[0]?.id ?? "", quantity: 1 }]);
        },
        onError: (e) => toast.error(isApiError(e) ? e.message : "Failed to restock"),
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Restock"
        description="Receive new stock from suppliers. Each line creates an inventory movement."
        actions={
          <Button onClick={submit} disabled={restockM.isPending}>
            <Save className="mr-1 h-4 w-4" />
            {restockM.isPending ? "Saving…" : "Save restock"}
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Product</TableHead>
                <TableHead className="w-32">Quantity</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell>
                    <Select value={r.productId} onValueChange={(v) => updateRow(r.key, { productId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={r.quantity}
                      onChange={(e) => updateRow(r.key, { quantity: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Optional note"
                      value={r.note ?? ""}
                      onChange={(e) => updateRow(r.key, { note: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={rows.length === 1}
                      onClick={() => removeRow(r.key)}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="mr-1 h-4 w-4" />
              Add line
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
