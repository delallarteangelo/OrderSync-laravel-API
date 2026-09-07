import * as React from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
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
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useProducts,
  useUpdateCategory,
} from "@/shared/hooks/useApi";
import { isApiError } from "@/shared/api/errors";

export function CategoryListPage() {
  const categories = useCategories().data ?? [];
  const products = useProducts().data ?? [];
  const createM = useCreateCategory();
  const updateM = useUpdateCategory();
  const deleteM = useDeleteCategory();

  const [newName, setNewName] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState("");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const countOf = (cid: string) => products.filter((p) => p.categoryId === cid).length;

  const handleAdd = () => {
    if (!newName.trim()) return;
    createM.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => {
          setNewName("");
          toast.success("Category added");
        },
        onError: (e) => toast.error(isApiError(e) ? e.message : "Failed to add category"),
      },
    );
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const commitEdit = () => {
    if (!editingId) return;
    const cat = categories.find((c) => c.id === editingId);
    if (!cat) return;
    updateM.mutate(
      { id: editingId, payload: { name: editingName.trim() || cat.name } },
      {
        onSuccess: () => {
          setEditingId(null);
          toast.success("Category updated");
        },
        onError: (e) => toast.error(isApiError(e) ? e.message : "Failed to update category"),
      },
    );
  };

  return (
    <>
      <PageHeader title="Categories" description="Group products for easier browsing and POS tiles." />
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add a new category…"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button onClick={handleAdd}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    {editingId === c.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && commitEdit()}
                        autoFocus
                      />
                    ) : (
                      <span className="font-medium">{c.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {countOf(c.id)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {editingId === c.id ? (
                        <>
                          <Button size="icon" variant="ghost" onClick={commitEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" onClick={() => startEdit(c.id, c.name)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}>
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete category?"
        description="Products assigned to this category will keep their reference, but the category will no longer appear in filters."
        destructive
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) {
            deleteM.mutate(deleteId, {
              onSuccess: () => {
                toast.success("Category deleted");
                setDeleteId(null);
              },
              onError: (e) => {
                toast.error(isApiError(e) ? e.message : "Failed to delete");
                setDeleteId(null);
              },
            });
          }
        }}
      />
    </>
  );
}
