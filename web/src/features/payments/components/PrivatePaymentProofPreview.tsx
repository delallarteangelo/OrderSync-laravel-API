import * as React from "react";
import { Download, Eye, FileText, ImageIcon, LoaderCircle } from "lucide-react";
import { getPrivatePaymentFile, openPrivatePaymentFile } from "@/shared/api/payments";
import { Button } from "@/shared/components/ui/button";

type Props = {
  path: string;
  mimeType: string;
  paymentId: string;
  autoLoad?: boolean;
};

export function PrivatePaymentProofPreview({ path, mimeType, paymentId, autoLoad = false }: Props) {
  const [source, setSource] = React.useState<string>();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(async () => {
    if (source || loading) return;
    setLoading(true);
    setError(false);
    try {
      const blob = await getPrivatePaymentFile(path);
      setSource(URL.createObjectURL(blob));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [loading, path, source]);

  React.useEffect(() => {
    if (autoLoad) void load();
  }, [autoLoad, load]);

  React.useEffect(
    () => () => {
      if (source) URL.revokeObjectURL(source);
    },
    [source],
  );

  const image = mimeType.startsWith("image/");
  return (
    <div className="overflow-hidden rounded-lg border bg-muted/20">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          {image ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          Attached payment proof
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => openPrivatePaymentFile(path, `subscription-payment-${paymentId}`)}
        >
          <Download className="mr-1 h-4 w-4" /> Open original
        </Button>
      </div>
      {!source && (
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 p-4 text-center">
          {loading ? (
            <LoaderCircle className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Eye className="h-6 w-6 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {error
              ? "The private proof could not be previewed. You can still open the original."
              : "Preview the privately stored receipt without leaving this review."}
          </p>
          {!loading && !error && (
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              Preview proof
            </Button>
          )}
          {error && (
            <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
              Try preview again
            </Button>
          )}
        </div>
      )}
      {source && image && (
        <img
          className="max-h-96 w-full bg-white object-contain"
          src={source}
          alt="Submitted GCash or Maya payment proof"
        />
      )}
      {source && !image && (
        <iframe
          className="h-96 w-full bg-white"
          src={source}
          title="Submitted subscription payment proof PDF"
        />
      )}
    </div>
  );
}
