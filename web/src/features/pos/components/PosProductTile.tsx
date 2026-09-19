import * as React from "react";
import { ScanBarcode } from "lucide-react";
import type { Product } from "@/shared/types/catalog";
import { Badge } from "@/shared/components/ui/badge";
import { Money } from "@/shared/components/Money";

type PosProductTileProps = {
  product: Product;
  categoryName: string;
  onSelect: () => void;
};

export function PosProductTile({ product, categoryName, onSelect }: PosProductTileProps) {
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => setImageFailed(false), [product.imageUrl]);

  return (
    <button
      type="button"
      disabled={product.stockOnHand === 0}
      onClick={onSelect}
      className="group flex min-h-0 flex-col items-start gap-1 rounded-lg border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-md bg-muted/40 text-muted-foreground">
        {product.imageUrl && !imageFailed ? (
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-contain p-1"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ScanBarcode className="h-6 w-6 opacity-50" aria-hidden="true" />
        )}
      </div>
      <p className="line-clamp-2 text-xs font-medium">{product.name}</p>
      <p className="text-[10px] text-muted-foreground">{categoryName}</p>
      <div className="mt-auto flex w-full items-center justify-between pt-2">
        <Money value={product.price} className="text-sm font-semibold" />
        {product.stockOnHand <= product.lowStockThreshold && (
          <Badge variant={product.stockOnHand === 0 ? "destructive" : "warning"}>
            {product.stockOnHand === 0 ? "Out" : `${product.stockOnHand}`}
          </Badge>
        )}
      </div>
    </button>
  );
}
