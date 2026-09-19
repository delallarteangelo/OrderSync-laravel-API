import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/shared/types/catalog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/shared/components/ui/form";
import {
  useCategories,
  useCreateProduct,
  useProduct,
  useUpdateProduct,
  useUploadProductImage,
  useSettings,
} from "@/shared/hooks/useApi";
import { isApiError, type FieldErrors } from "@/shared/api/errors";

const schema = z.object({
  name: z.string().min(2, "Name is too short"),
  sku: z.string().min(2, "SKU required"),
  barcode: z.string().optional().or(z.literal("")),
  categoryId: z.string().min(1, "Category required"),
  description: z.string().optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price ≥ 0"),
  costPrice: z.coerce.number().min(0).optional(),
  stockOnHand: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const categoriesQ = useCategories();
  const settingsQ = useSettings();
  const lowStockDefault = settingsQ.data?.lowStockDefault;
  const categories = categoriesQ.data ?? [];
  const existingQ = useProduct(id);
  const existing = existingQ.data;
  const createM = useCreateProduct();
  const updateM = useUpdateProduct();
  const uploadImageM = useUploadProductImage();
  const [imagePreview, setImagePreview] = React.useState<string | undefined>(
    existing?.imageUrl ?? undefined,
  );
  const [selectedImage, setSelectedImage] = React.useState<File | null>(null);

  React.useEffect(
    () => () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );

  React.useEffect(() => {
    if (existing) {
      form.reset({
        name: existing.name,
        sku: existing.sku,
        barcode: existing.barcode ?? "",
        categoryId: existing.categoryId,
        description: existing.description ?? "",
        price: existing.price,
        costPrice: existing.costPrice ?? 0,
        stockOnHand: existing.stockOnHand,
        lowStockThreshold: existing.lowStockThreshold,
        isActive: existing.isActive,
      });
      if (existing.imageUrl) setImagePreview(existing.imageUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? {
          name: existing.name,
          sku: existing.sku,
          barcode: existing.barcode ?? "",
          categoryId: existing.categoryId,
          description: existing.description ?? "",
          price: existing.price,
          costPrice: existing.costPrice ?? 0,
          stockOnHand: existing.stockOnHand,
          lowStockThreshold: existing.lowStockThreshold,
          isActive: existing.isActive,
        }
      : {
          name: "",
          sku: "",
          barcode: "",
          categoryId: categories[0]?.id ?? "",
          description: "",
          price: 0,
          costPrice: 0,
          stockOnHand: 0,
          lowStockThreshold: 10,
          isActive: true,
        },
  });

  React.useEffect(() => {
    if (!id && lowStockDefault !== undefined && !form.getFieldState("lowStockThreshold").isDirty) {
      form.setValue("lowStockThreshold", lowStockDefault);
    }
  }, [id, lowStockDefault, form]);

  const onSubmit = async (values: FormValues) => {
    const payload: Partial<Product> = {
      name: values.name,
      sku: values.sku,
      barcode: values.barcode || undefined,
      categoryId: values.categoryId,
      description: values.description || undefined,
      price: values.price,
      costPrice: values.costPrice,
      ...(!existing ? { stockOnHand: values.stockOnHand } : {}),
      lowStockThreshold: values.lowStockThreshold,
      isActive: values.isActive,
    };
    try {
      const saved = existing
        ? await updateM.mutateAsync({ id: existing.id, payload })
        : await createM.mutateAsync(payload);
      if (selectedImage) {
        await uploadImageM.mutateAsync({ productId: saved.id, file: selectedImage });
      }
      toast.success(existing ? "Product updated" : "Product created");
      navigate("/catalog");
    } catch (e: unknown) {
      if (isApiError(e) && e.fieldErrors) {
        const fe = e.fieldErrors as FieldErrors;
        for (const k of Object.keys(fe)) {
          if (k in form.getValues()) {
            form.setError(k as keyof FormValues, { message: fe[k][0] });
          }
        }
      }
      toast.error(isApiError(e) ? e.message : "Failed to save product");
    }
  };

  const saving = createM.isPending || updateM.isPending || uploadImageM.isPending;
  const loadingDefaults = !existing && !settingsQ.data;

  const handleImage = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setSelectedImage(file);
    setImagePreview(url);
  };

  return (
    <>
      <PageHeader
        breadcrumbs={
          <Button asChild variant="ghost" size="sm" className="-ml-3 h-7 px-2">
            <Link to="/catalog">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Catalog
            </Link>
          </Button>
        }
        title={existing ? "Edit product" : "New product"}
        description="Maintain product details, pricing and stock."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Coca-Cola 1.5L" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SKU-0001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="EAN-13 (optional)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} placeholder="Optional product notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pricing & stock</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₱)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost (₱)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stockOnHand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock on hand</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={!!existing} />
                      </FormControl>
                      {existing && (
                        <FormDescription>Use Inventory to adjust existing stock.</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Low stock threshold</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Alert when stock falls to or below this value.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/40">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleImage(e.target.files?.[0])}
                />
                <p className="text-xs text-muted-foreground">Optional. Used on POS grid tiles.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>Inactive products are hidden from POS.</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {loadingDefaults && (
              <p
                role={settingsQ.isError ? "alert" : undefined}
                className={
                  settingsQ.isError ? "text-sm text-destructive" : "text-sm text-muted-foreground"
                }
              >
                {settingsQ.isError
                  ? "Unable to load product defaults. "
                  : "Loading product defaults…"}
                {settingsQ.isError && (
                  <button
                    type="button"
                    className="underline"
                    onClick={() => void settingsQ.refetch()}
                  >
                    Try again
                  </button>
                )}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/catalog")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || loadingDefaults}>
                {saving ? "Saving…" : existing ? "Save changes" : "Create product"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
