import * as React from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  MessageCircle,
  Minus,
  PackageSearch,
  Plus,
  ShoppingCart,
  Store,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/app/stores/authStore";
import { useStorefrontCartStore } from "@/app/stores/storefrontCartStore";
import {
  useCancelCustomerOrder,
  useCustomerOrders,
  usePlaceCustomerOrder,
  useStorefront,
  useStorefronts,
} from "@/shared/hooks/useApi";
import { isApiError } from "@/shared/api/errors";
import { Money } from "@/shared/components/Money";
import { StatusChip } from "@/shared/components/StatusChip";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import { fmtDateTime } from "@/shared/lib/dates";
import {
  listCustomerPaymentInstructions,
  openPrivatePaymentFile,
  submitOrderPayment,
} from "@/shared/api/payments";
import type { Order } from "@/shared/types/orders";
import type { WalletMethod } from "@/shared/types/payments";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { CustomerSupportPanel } from "@/features/storefront/components/CustomerSupportPanel";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { LoadingState } from "@/shared/components/LoadingState";

export function StorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const directory = useStorefronts();
  const storefront = useStorefront(slug);
  const cart = useStorefrontCartStore();
  const setCartBusiness = useStorefrontCartStore((state) => state.setBusiness);
  const signedIntoStore = !!slug && user?.role === "CUSTOMER" && user.business?.slug === slug;
  const orders = useCustomerOrders(signedIntoStore);
  const placeOrder = usePlaceCustomerOrder();
  const cancelOrder = useCancelCustomerOrder();
  const checkoutKey = React.useRef<string | null>(null);
  const online = useOnlineStatus();

  React.useEffect(() => {
    if (slug) setCartBusiness(slug);
  }, [slug, setCartBusiness]);

  if (!slug) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-muted/30 px-4 py-10 outline-none"
      >
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold">OrderSync stores</h1>
              <p className="text-sm text-muted-foreground">Choose a store for pickup ordering.</p>
            </div>
          </div>
          {directory.isLoading && <LoadingState label="Loading stores…" />}
          {directory.isError && (
            <ErrorState
              title="Stores are unavailable"
              message="Check the connection and try again."
              onRetry={() => void directory.refetch()}
            />
          )}
          {!directory.isLoading && !directory.isError && (directory.data ?? []).length === 0 && (
            <EmptyState title="No stores are accepting orders" />
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(directory.data ?? []).map((business) => (
              <Card key={business.id}>
                <CardHeader>
                  <CardTitle>{business.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Badge variant="secondary">Pickup</Badge>
                  <Button asChild className="w-full">
                    <Link to={`/shop/${business.slug}`}>Browse store</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (storefront.isLoading) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-screen max-w-3xl p-8 outline-none"
      >
        <LoadingState label="Loading storefront…" />
      </main>
    );
  }
  if (!storefront.data) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto min-h-screen max-w-3xl p-8 outline-none"
      >
        <ErrorState
          title="This storefront is unavailable"
          message="It may be closed to online ordering or the connection may be unavailable."
          onRetry={() => void storefront.refetch()}
        />
      </main>
    );
  }

  const data = storefront.data;
  const total = cart.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  const submit = () => {
    if (!online) {
      toast.error("Reconnect before placing the order. Your cart is still saved on this device.");
      return;
    }
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (!signedIntoStore) {
      toast.error("Sign in with a customer account for this store.");
      return;
    }
    const idempotencyKey = checkoutKey.current ?? crypto.randomUUID();
    checkoutKey.current = idempotencyKey;
    placeOrder.mutate(
      {
        items: cart.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        idempotencyKey,
      },
      {
        onSuccess: (order) => {
          cart.clear();
          checkoutKey.current = null;
          toast.success(`Order ${order.code} was placed for pickup.`);
        },
        onError: (error) => {
          const itemError = isApiError(error) ? error.fieldErrors?.items?.[0] : undefined;
          toast.error(isApiError(error) ? (itemError ?? error.message) : "Unable to place order");
        },
      },
    );
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-muted/30 outline-none">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/shop" aria-label="Back to store directory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Store className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-semibold">{data.business.name}</h1>
            <p className="text-xs text-muted-foreground">Order online · Pickup only</p>
          </div>
          <div className="ml-auto max-w-full text-sm">
            {signedIntoStore ? (
              `Hi, ${user.fullName}`
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/login" state={{ from: location.pathname }}>
                  Customer sign in
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <nav
        aria-label="Store sections"
        className="sticky top-0 z-20 flex gap-1 overflow-x-auto border-b bg-background/95 px-3 py-2 shadow-sm backdrop-blur lg:hidden"
      >
        <Button asChild size="sm" variant="ghost" className="shrink-0">
          <a href="#catalog">
            <PackageSearch className="mr-1 h-4 w-4" /> Catalog
          </a>
        </Button>
        <Button asChild size="sm" variant="ghost" className="shrink-0">
          <a href="#cart">
            <ShoppingCart className="mr-1 h-4 w-4" /> Cart ({cart.lines.length})
          </a>
        </Button>
        {signedIntoStore && (
          <>
            <Button asChild size="sm" variant="ghost" className="shrink-0">
              <a href="#orders">
                <ClipboardList className="mr-1 h-4 w-4" /> Orders
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost" className="shrink-0">
              <a href="#support">
                <MessageCircle className="mr-1 h-4 w-4" /> Support
              </a>
            </Button>
          </>
        )}
      </nav>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 pb-24 lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-6">
        <section id="catalog" className="min-w-0 scroll-mt-20 space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Available products</h2>
            <p className="text-sm text-muted-foreground">
              Prices and availability come from the store. The server rechecks them at checkout.
            </p>
            {!online && (
              <p className="mt-2 text-sm font-medium text-amber-800">
                You are viewing the last cached public catalog. Checkout waits for a connection.
              </p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="flex h-36 items-center justify-center bg-muted text-muted-foreground">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store className="h-9 w-9" />
                  )}
                </div>
                <CardContent className="space-y-3 p-4">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.categoryName}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Money value={product.price} className="font-semibold" />
                    <span className="text-xs text-muted-foreground">
                      {product.stockOnHand} available
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    disabled={product.stockOnHand === 0}
                    onClick={() => cart.add(product)}
                  >
                    Add to cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {signedIntoStore && (
            <div id="orders" className="scroll-mt-20 space-y-3">
              <h2 className="text-xl font-semibold">My orders</h2>
              {!online && orders.isError && (
                <p className="text-sm text-muted-foreground">
                  Private order history is not stored for offline use. Reconnect to refresh it.
                </p>
              )}
              {(orders.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              )}
              {(orders.data ?? []).map((order) => (
                <Card key={order.id}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="min-w-0 flex-1 basis-48">
                        <p className="font-medium">{order.code}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDateTime(order.placedAt)} · {order.items.length} item(s)
                        </p>
                      </div>
                      <Money value={order.total} />
                      <StatusChip status={order.status} />
                      {order.status === "PENDING" &&
                        !order.payments.some((payment) => payment.status === "VERIFIED") && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={cancelOrder.isPending || !online}
                            onClick={() =>
                              cancelOrder.mutate(
                                { id: order.id, note: "Cancelled by customer" },
                                {
                                  onSuccess: () =>
                                    toast.success(`Order ${order.code} cancellation confirmed.`),
                                  onError: (error) =>
                                    toast.error(
                                      isApiError(error)
                                        ? error.message
                                        : "Unable to cancel the order.",
                                    ),
                                },
                              )
                            }
                          >
                            Cancel
                          </Button>
                        )}
                    </div>
                    <CustomerPaymentPanel
                      order={order}
                      online={online}
                      onChanged={() => orders.refetch()}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {signedIntoStore && <CustomerSupportPanel businessSlug={slug} />}
        </section>

        <aside id="cart" className="min-w-0 scroll-mt-20">
          <Card className="lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Cart
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.lines.length === 0 && (
                <p className="text-sm text-muted-foreground">Your cart is empty.</p>
              )}
              {cart.lines.map((line) => (
                <div key={line.productId} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{line.name}</p>
                      <Money value={line.unitPrice * line.quantity} className="text-sm" />
                    </div>
                    <Button
                      aria-label={`Remove ${line.name} from cart`}
                      size="icon"
                      variant="ghost"
                      onClick={() => cart.remove(line.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      aria-label={`Decrease ${line.name} quantity`}
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => cart.setQuantity(line.productId, line.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{line.quantity}</span>
                    <Button
                      aria-label={`Increase ${line.name} quantity`}
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      disabled={line.quantity >= line.stockOnHand}
                      onClick={() => cart.setQuantity(line.productId, line.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <Money value={total} />
              </div>
              <p className="text-xs text-muted-foreground">
                Saved on this device. The server confirms current price and stock before accepting
                the order.
              </p>
              <Button
                className="w-full"
                disabled={cart.lines.length === 0 || placeOrder.isPending || !online}
                onClick={submit}
              >
                {placeOrder.isPending
                  ? "Waiting for server…"
                  : online
                    ? "Place pickup order"
                    : "Reconnect to checkout"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function CustomerPaymentPanel({
  order,
  online,
  onChanged,
}: {
  order: Order;
  online: boolean;
  onChanged: () => void;
}) {
  const instructions = useQuery({
    queryKey: ["customer", "payment-instructions", order.business.id],
    queryFn: listCustomerPaymentInstructions,
    enabled: order.status === "PENDING" && online,
  });
  const [method, setMethod] = React.useState<WalletMethod>("GCASH");
  const [reference, setReference] = React.useState("");
  const [proof, setProof] = React.useState<File>();
  const submit = useMutation({
    mutationFn: () => submitOrderPayment(order.id, method, reference.trim(), proof!),
    onSuccess: (payment) => {
      toast.success(
        payment.duplicateProof || payment.duplicateReference
          ? "Proof submitted with a duplicate-review warning."
          : "Proof submitted for manual review.",
      );
      setReference("");
      setProof(undefined);
      onChanged();
    },
    onError: (error) => toast.error(isApiError(error) ? error.message : "Unable to submit proof."),
  });
  const latest = order.payments[0];
  const active = order.payments.find(
    (payment) => payment.status === "SUBMITTED" || payment.status === "VERIFIED",
  );

  if (latest?.status === "VERIFIED") {
    return (
      <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-900">
        Manually verified {latest.method} payment · Receipt {latest.receiptNumber}
      </div>
    );
  }
  if (active?.status === "SUBMITTED") {
    return (
      <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
        {active.method} proof is awaiting manual review. This is not provider confirmation.
      </div>
    );
  }
  if (order.status !== "PENDING" || (instructions.data ?? []).length === 0) {
    return latest?.status === "REJECTED" ? (
      <p className="text-sm text-destructive">Payment rejected: {latest.rejectionReason}</p>
    ) : null;
  }

  const selected = instructions.data?.find((item) => item.method === method);
  return (
    <div className="space-y-3 rounded-md border p-3">
      {latest?.status === "REJECTED" && (
        <p className="text-sm text-destructive">
          Previous proof rejected: {latest.rejectionReason}
        </p>
      )}
      <p className="text-sm font-medium">Pay with GCash or Maya</p>
      <p className="text-xs text-muted-foreground">
        Proofs are checked by the store manually. OrderSync does not contact the wallet provider.
      </p>
      <div className="flex gap-2">
        {(instructions.data ?? []).map((instruction) => (
          <Button
            key={instruction.id}
            size="sm"
            variant={method === instruction.method ? "default" : "outline"}
            onClick={() => setMethod(instruction.method)}
          >
            {instruction.method}
          </Button>
        ))}
      </div>
      {selected && (
        <div className="rounded bg-muted p-3 text-sm">
          <p>{selected.accountName}</p>
          <p className="font-medium">{selected.accountNumber}</p>
          {selected.instructions && <p className="text-xs">{selected.instructions}</p>}
          {selected.qrAvailable && (
            <Button
              className="mt-2"
              size="sm"
              variant="outline"
              disabled={!online}
              onClick={() =>
                openPrivatePaymentFile(
                  `/customer/payment-instructions/${selected.id}/qr`,
                  `${selected.method}-QR`,
                )
              }
            >
              <Download className="mr-1 h-4 w-4" /> Open QR
            </Button>
          )}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Wallet reference</Label>
          <Input value={reference} onChange={(event) => setReference(event.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Screenshot or receipt</Label>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={(event) => setProof(event.target.files?.[0])}
          />
        </div>
      </div>
      <Button
        disabled={!online || submit.isPending || !reference.trim() || !proof}
        onClick={() => submit.mutate()}
      >
        {submit.isPending
          ? "Waiting for server…"
          : online
            ? "Submit for manual review"
            : "Reconnect to submit"}
      </Button>
      <p className="text-xs text-muted-foreground">
        A proof is shown as submitted only after the server accepts the upload.
      </p>
    </div>
  );
}
