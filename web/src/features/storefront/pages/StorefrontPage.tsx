import * as React from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingCart, Store, Trash2 } from "lucide-react";
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

  React.useEffect(() => {
    if (slug) setCartBusiness(slug);
  }, [slug, setCartBusiness]);

  if (!slug) {
    return (
      <main className="min-h-screen bg-muted/30 px-4 py-10">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center gap-3">
            <Store className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold">OrderSync stores</h1>
              <p className="text-sm text-muted-foreground">Choose a store for pickup ordering.</p>
            </div>
          </div>
          {directory.isLoading && <p>Loading stores…</p>}
          {directory.isError && <p>Stores are unavailable right now.</p>}
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

  if (storefront.isLoading) return <p className="p-8">Loading storefront…</p>;
  if (!storefront.data) return <p className="p-8">This storefront is unavailable.</p>;

  const data = storefront.data;
  const total = cart.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  const submit = () => {
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
    <main className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/shop">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Store className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-semibold">{data.business.name}</h1>
            <p className="text-xs text-muted-foreground">Order online · Pickup only</p>
          </div>
          <div className="ml-auto text-sm">
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

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Available products</h2>
            <p className="text-sm text-muted-foreground">
              Prices and availability are confirmed by the store.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.products.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="flex h-36 items-center justify-center bg-muted text-muted-foreground">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
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
            <div className="space-y-3">
              <h2 className="text-xl font-semibold">My orders</h2>
              {(orders.data ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No orders yet.</p>
              )}
              {(orders.data ?? []).map((order) => (
                <Card key={order.id}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-4">
                    <div className="min-w-48 flex-1">
                      <p className="font-medium">{order.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDateTime(order.placedAt)} · {order.items.length} item(s)
                      </p>
                    </div>
                    <Money value={order.total} />
                    <StatusChip status={order.status} />
                    {order.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cancelOrder.isPending}
                        onClick={() =>
                          cancelOrder.mutate({ id: order.id, note: "Cancelled by customer" })
                        }
                      >
                        Cancel
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <aside>
          <Card className="sticky top-4">
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
                    <Button size="icon" variant="ghost" onClick={() => cart.remove(line.productId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => cart.setQuantity(line.productId, line.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{line.quantity}</span>
                    <Button
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
                Pickup only. Stock is deducted when the store confirms your order.
              </p>
              <Button
                className="w-full"
                disabled={cart.lines.length === 0 || placeOrder.isPending}
                onClick={submit}
              >
                {placeOrder.isPending ? "Placing order…" : "Place pickup order"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
