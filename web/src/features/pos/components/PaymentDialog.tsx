import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Money } from "@/shared/components/Money";
import type { PaymentMethod } from "@/shared/types/pos";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  submitting: boolean;
  onFinalize: (method: PaymentMethod, tendered?: number, paymentReference?: string) => void;
};

export function PaymentDialog({ open, onOpenChange, total, submitting, onFinalize }: Props) {
  const [method, setMethod] = React.useState<PaymentMethod>("CASH");
  const [tenderedStr, setTenderedStr] = React.useState<string>("");
  const [paymentReference, setPaymentReference] = React.useState("");
  const tendered = Number(tenderedStr) || 0;
  const change = Math.max(0, tendered - total);
  const invalid =
    (method === "CASH" && tendered < total) ||
    (method !== "CASH" && paymentReference.trim().length === 0);

  React.useEffect(() => {
    if (open) {
      setMethod("CASH");
      setTenderedStr(total.toFixed(2));
      setPaymentReference("");
    }
  }, [open, total]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
          <DialogDescription>
            Total due:{" "}
            <strong>
              <Money value={total} />
            </strong>
          </DialogDescription>
        </DialogHeader>
        <Tabs value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
          <TabsList className="grid h-auto w-full grid-cols-5">
            <TabsTrigger value="CASH">Cash</TabsTrigger>
            <TabsTrigger value="GCASH">GCash</TabsTrigger>
            <TabsTrigger value="MAYA">Maya</TabsTrigger>
            <TabsTrigger value="CARD">Card</TabsTrigger>
            <TabsTrigger value="OTHER">Other</TabsTrigger>
          </TabsList>
          <TabsContent value="CASH" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <Label>Tendered (₱)</Label>
              <Input
                type="number"
                value={tenderedStr}
                onChange={(e) => setTenderedStr(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[100, 200, 500, 1000].map((d) => (
                <Button
                  key={d}
                  variant="outline"
                  size="sm"
                  onClick={() => setTenderedStr(String((Number(tenderedStr) || 0) + d))}
                >
                  +₱{d}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={() => setTenderedStr(total.toFixed(2))}>
                Exact
              </Button>
            </div>
            <div className="rounded-md bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Change</span>
                <span className="font-semibold">
                  <Money value={change} />
                </span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="GCASH" className="pt-3 text-sm text-muted-foreground">
            Record the customer-provided GCash reference. This does not verify it with GCash.
          </TabsContent>
          <TabsContent value="MAYA" className="pt-3 text-sm text-muted-foreground">
            Record the customer-provided Maya reference. This does not verify it with Maya.
          </TabsContent>
          <TabsContent value="CARD" className="pt-3 text-sm text-muted-foreground">
            Record the reference returned by the separate card terminal.
          </TabsContent>
          <TabsContent value="OTHER" className="pt-3 text-sm text-muted-foreground">
            Record the reference supplied for this payment.
          </TabsContent>
        </Tabs>
        {method !== "CASH" && (
          <div className="space-y-1.5">
            <Label>Payment reference</Label>
            <Input
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
              maxLength={120}
              placeholder="Required recorded reference"
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={invalid || submitting}
            onClick={() =>
              onFinalize(
                method,
                method === "CASH" ? tendered : undefined,
                method === "CASH" ? undefined : paymentReference.trim(),
              )
            }
          >
            {submitting ? "Finalizing…" : "Confirm payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
