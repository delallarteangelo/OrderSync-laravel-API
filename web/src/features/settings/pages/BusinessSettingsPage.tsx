import * as React from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { useSettings, useUpdateSettings } from "@/shared/hooks/useApi";
import { isApiError } from "@/shared/api/errors";
import type { BusinessSettings } from "@/shared/types/settings";

export function BusinessSettingsPage() {
  const settingsQ = useSettings();
  const updateM = useUpdateSettings();
  const [draft, setDraft] = React.useState<BusinessSettings | null>(null);

  React.useEffect(() => {
    if (settingsQ.data && !draft) setDraft(settingsQ.data);
  }, [settingsQ.data, draft]);

  if (!draft) {
    return (
      <>
        <PageHeader title="Business settings" description="Loading…" />
      </>
    );
  }

  const set = <K extends keyof BusinessSettings>(k: K, v: BusinessSettings[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = () => {
    updateM.mutate(draft, {
      onSuccess: () => toast.success("Settings saved"),
      onError: (e) => toast.error(isApiError(e) ? e.message : "Failed to save settings"),
    });
  };

  return (
    <>
      <PageHeader
        title="Business settings"
        description="Store profile, tax, receipt template, and inventory defaults."
        actions={
          <Button onClick={save} disabled={updateM.isPending}>
            <Save className="mr-1 h-4 w-4" />
            {updateM.isPending ? "Saving…" : "Save changes"}
          </Button>
        }
      />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Store profile</TabsTrigger>
          <TabsTrigger value="tax">Tax &amp; currency</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
          <TabsTrigger value="inventory">Inventory defaults</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <Field label="Store name">
                <Input value={draft.storeName} onChange={(e) => set("storeName", e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <Input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Address" className="md:col-span-2">
                <Textarea
                  rows={2}
                  value={draft.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <Field label="Tax rate (%)">
                <Input
                  type="number"
                  step="0.01"
                  value={draft.taxRate}
                  onChange={(e) => set("taxRate", Number(e.target.value))}
                />
              </Field>
              <Field label="Currency symbol">
                <Input
                  value={draft.currencySymbol}
                  onChange={(e) => set("currencySymbol", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt">
          <Card>
            <CardContent className="space-y-4 p-6">
              <Field label="Receipt header">
                <Textarea
                  rows={2}
                  value={draft.receiptHeader}
                  onChange={(e) => set("receiptHeader", e.target.value)}
                />
              </Field>
              <Field label="Receipt footer">
                <Textarea
                  rows={2}
                  value={draft.receiptFooter}
                  onChange={(e) => set("receiptFooter", e.target.value)}
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Both fields appear on every printed POS receipt.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <Field label="Default low-stock threshold">
                <Input
                  type="number"
                  value={draft.lowStockDefault}
                  onChange={(e) => set("lowStockDefault", Number(e.target.value))}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
