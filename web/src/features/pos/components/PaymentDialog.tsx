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
  onFinalize: (method: PaymentMethod, tendered?: number) => void;
};

export function PaymentDialog({ open, onOpenChange, total, onFinalize }: Props) {
  const [method, setMethod] = React.useState<PaymentMethod>("CASH");
  const [tenderedStr, setTenderedStr] = React.useState<string>("");
  const tendered = Number(tenderedStr) || 0;
  const change = Math.max(0, tendered - total);
  const insufficient = method === "CASH" && tendered < total;

  React.useEffect(() => {
    if (open) {
      setMethod("CASH");
      setTenderedStr(total.toFixed(2));
    }
  }, [open, total]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
          <DialogDescription>
            Total due: <strong><Money value={total} /></strong>
          </DialogDescription>
        </DialogHeader>
        <Tabs value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="CASH">Cash</TabsTrigger>
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
          <TabsContent value="CARD" className="pt-3 text-sm text-muted-foreground">
            Swipe / tap the card on the terminal. Confirm when approved.
          </TabsContent>
          <TabsContent value="OTHER" className="pt-3 text-sm text-muted-foreground">
            Record the reference (e.g. GCash, bank transfer) on the receipt note after confirming.
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={insufficient}
            onClick={() => onFinalize(method, method === "CASH" ? tendered : undefined)}
          >
            Confirm payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
