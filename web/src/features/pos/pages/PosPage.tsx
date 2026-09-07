import * as React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  ScanBarcode,
  Search,
  Store,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { Money } from "@/shared/components/Money";
import { useCategories, useFinalizeSale, useProducts, useSettings } from "@/shared/hooks/useApi";
import { usePosCartStore } from "@/app/stores/posCartStore";
import { useAuthStore } from "@/app/stores/authStore";
import { useRole } from "@/shared/hooks/useRole";
import { getProductByBarcode } from "@/shared/api/catalog";
import { isApiError } from "@/shared/api/errors";
import { useBarcodeScanner } from "@/shared/hooks/useBarcodeScanner";
import { ScanInput } from "../components/ScanInput";
import { PaymentDialog } from "../components/PaymentDialog";
import { ReceiptView } from "../components/ReceiptView";
import { WebcamScannerDialog } from "../components/WebcamScannerDialog";
import type { PosSale } from "@/shared/types/pos";

export function PosPage() {
  const products = useProducts().data ?? [];
  const categories = useCategories().data ?? [];
  const settings = useSettings().data;
  const taxRate = (settings?.taxRate ?? 12) / 100;
  const cart = usePosCartStore();
  const { isAdmin } = useRole();
  const user = useAuthStore((s) => s.user)!;
  const finalizeM = useFinalizeSale();
  const categoryName = React.useCallback(
    (id: string) => categories.find((c) => c.id === id)?.name ?? "—",
    [categories],
  );

  const [search, setSearch] = React.useState("");
  const [activeCat, setActiveCat] = React.useState<string>("ALL");
  const [paymentOpen, setPaymentOpen] = React.useState(false);
  const [clearOpen, setClearOpen] = React.useState(false);
  const [webcamOpen, setWebcamOpen] = React.useState(false);
  const [lastSale, setLastSale] = React.useState<PosSale | null>(null);
  const scanRef = React.useRef<HTMLInputElement>(null);

  const visibleProducts = React.useMemo(() => {
    let list = products.filter((p) => p.isActive);
    if (activeCat !== "ALL") list = list.filter((p) => p.categoryId === activeCat);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.barcode ?? "").includes(q),
      );
    }
    return list.slice(0, 36);
  }, [products, activeCat, search]);

  const subtotal = cart.lines.reduce(
    (a, l) => a + l.unitPrice * l.quantity - (l.lineDiscount ?? 0),
    0,
  );
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  const grandTotal = subtotal + tax;

  // Global barcode/SKU scan
  useBarcodeScanner(async (code) => {
    const local = products.find((p) => p.sku === code || p.barcode === code);
    if (local) {
      cart.addProduct(local);
      toast.success(`Added ${local.name}`);
      return;
    }
    try {
      const remote = await getProductByBarcode(code);
      cart.addProduct(remote);
      toast.success(`Added ${remote.name}`);
    } catch {
      toast.error(`No product for "${code}"`);
    }
  });

  // Keyboard shortcuts
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        scanRef.current?.focus();
      } else if (e.key === "F9") {
        e.preventDefault();
        if (cart.lines.length) setPaymentOpen(true);
      } else if (e.key === "Escape") {
        if (paymentOpen) setPaymentOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cart.lines.length, paymentOpen]);

  const handleScan = async (code: string) => {
    const local = products.find((p) => p.sku === code || p.barcode === code);
    if (local) {
      cart.addProduct(local);
      toast.success(`Added ${local.name}`);
      return;
    }
    try {
      const remote = await getProductByBarcode(code);
      cart.addProduct(remote);
      toast.success(`Added ${remote.name}`);
    } catch {
      toast.error(`No product for "${code}"`);
    }
  };

  const handleFinalize = (
    method: "CASH" | "CARD" | "OTHER",
    tendered?: number,
  ) => {
    finalizeM.mutate(
      {
        lines: [...cart.lines],
        paymentMethod: method,
        tendered,
        discountTotal: cart.lines.reduce((a, l) => a + (l.lineDiscount ?? 0), 0),
      },
      {
        onSuccess: (sale) => {
          setLastSale(sale);
          cart.clear();
          setPaymentOpen(false);
          toast.success(`Sale finalized · ${sale.receiptNumber}`);
        },
        onError: (e) => {
          toast.error(isApiError(e) ? e.message : "Failed to finalize sale");
        },
      },
    );
  };

  if (lastSale) {
    return <ReceiptView sale={lastSale} onClose={() => setLastSale(null)} />;
  }

  return (
    <div className="flex h-screen w-full flex-col bg-muted/30">
      {/* Slim topbar */}
      <header className="flex h-14 items-center gap-3 border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Store className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold">POS</p>
        </div>
        <Badge variant="secondary">{user.fullName}</Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to app
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-hidden p-4 lg:grid-cols-[1fr_420px]">
        {/* Left: scan + grid */}
        <div className="flex min-h-0 flex-col gap-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <ScanBarcode className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium">Scan or type SKU/barcode</p>
              </div>
              <ScanInput ref={scanRef} onScan={handleScan} />
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products to add by click…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Tabs value={activeCat} onValueChange={setActiveCat}>
                <TabsList className="flex h-auto flex-wrap justify-start">
                  <TabsTrigger value="ALL">All</TabsTrigger>
                  {categories.map((c) => (
                    <TabsTrigger key={c.id} value={c.id}>
                      {c.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  cart.addProduct(p);
                  toast.success(`Added ${p.name}`);
                }}
                className="group relative flex flex-col items-start gap-1 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent/40"
              >
                <div className="flex h-16 w-full items-center justify-center rounded-md bg-muted/40 text-muted-foreground">
                  <ScanBarcode className="h-6 w-6 opacity-50" />
                </div>
                <p className="line-clamp-2 text-xs font-medium">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {categoryName(p.categoryId)}
                </p>
                <div className="mt-auto flex w-full items-center justify-between">
                  <Money value={p.price} className="text-sm font-semibold" />
                  {p.stockOnHand <= p.lowStockThreshold && (
                    <Badge variant={p.stockOnHand === 0 ? "destructive" : "warning"}>
                      {p.stockOnHand === 0 ? "Out" : `${p.stockOnHand}`}
                    </Badge>
                  )}
                </div>
              </button>
            ))}
            {visibleProducts.length === 0 && (
              <div className="col-span-full flex h-32 items-center justify-center text-sm text-muted-foreground">
                No products match your search.
              </div>
            )}
          </div>
        </div>

        {/* Right: cart */}
        <Card className="flex min-h-0 flex-col">
          <div className="flex items-center justify-between border-b p-3">
            <p className="text-sm font-semibold">Cart ({cart.lines.length})</p>
            {cart.lines.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600"
                onClick={() => setClearOpen(true)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {cart.lines.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                Cart is empty. Scan or click products to add.
              </div>
            ) : (
              <ul className="divide-y">
                {cart.lines.map((l) => (
                  <li key={l.productId} className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{l.name}</p>
                        <p className="text-xs text-muted-foreground">SKU {l.sku}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => cart.remove(l.productId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => cart.setQty(l.productId, l.quantity - 1)}
                        >
                          −
                        </Button>
                        <Input
                          className="h-7 w-12 text-center"
                          value={l.quantity}
                          onChange={(e) =>
                            cart.setQty(l.productId, Math.max(1, Number(e.target.value) || 1))
                          }
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => cart.setQty(l.productId, l.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      <Money value={l.unitPrice * l.quantity - (l.lineDiscount ?? 0)} className="text-sm font-medium" />
                    </div>
                    {isAdmin && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Discount ₱</span>
                        <Input
                          type="number"
                          className="h-7 w-24"
                          value={l.lineDiscount ?? 0}
                          onChange={(e) => cart.setDiscount(l.productId, Number(e.target.value) || 0)}
                        />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="space-y-2 border-t p-4">
            <Row label="Subtotal" value={<Money value={subtotal} />} />
            <Row label={`Tax (${(taxRate * 100).toFixed(0)}%)`} value={<Money value={tax} />} />
            <Separator />
            <Row
              label={<span className="text-base font-semibold">Total</span>}
              value={
                <span className="text-base font-semibold">
                  <Money value={grandTotal} />
                </span>
              }
            />
            <Button
              className="w-full"
              size="lg"
              disabled={cart.lines.length === 0}
              onClick={() => setPaymentOpen(true)}
            >
              Charge <Money value={grandTotal} className="ml-2" />
            </Button>
          </div>
        </Card>
      </div>

      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        total={grandTotal}
        onFinalize={handleFinalize}
      />
      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear cart?"
        description="All items in the current cart will be removed."
        destructive
        confirmLabel="Clear"
        onConfirm={() => {
          cart.clear();
          toast.success("Cart cleared");
        }}
      />
      <WebcamScannerDialog open={webcamOpen} onOpenChange={setWebcamOpen} />
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
