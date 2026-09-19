import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Money } from "@/shared/components/Money";
import type { PosSale } from "@/shared/types/pos";
import { fmtDateTime } from "@/shared/lib/dates";
import { usePrintReceipt } from "@/shared/hooks/usePrintReceipt";

type Props = {
  sale: PosSale;
  onClose: () => void;
};

export function ReceiptView({ sale, onClose }: Props) {
  const print = usePrintReceipt();
  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 p-6">
      <div className="mb-4 flex w-full max-w-md items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          New sale
        </Button>
        <Button onClick={print}>
          <Printer className="mr-1 h-4 w-4" />
          Print receipt
        </Button>
      </div>
      <div className="receipt-print w-full max-w-[320px] rounded-md border bg-white p-4 font-mono text-[12px] leading-tight text-black shadow-sm">
        <div className="text-center">
          <p className="text-sm font-bold">{sale.businessName}</p>
          <p className="whitespace-pre-line">
            {sale.receiptHeader || "OrderSync POS sales receipt"}
          </p>
        </div>
        <hr className="my-2 border-dashed border-black/50" />
        <div className="flex justify-between">
          <span>Receipt</span>
          <span>{sale.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date</span>
          <span>{fmtDateTime(sale.completedAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier</span>
          <span>{sale.cashierName}</span>
        </div>
        <hr className="my-2 border-dashed border-black/50" />
        {sale.lines.map((l) => (
          <div key={l.productId} className="mb-1">
            <p>{l.name}</p>
            <div className="flex justify-between">
              <span>
                {l.quantity} × <Money value={l.unitPrice} />
              </span>
              <Money value={l.unitPrice * l.quantity - (l.lineDiscount ?? 0)} />
            </div>
          </div>
        ))}
        <hr className="my-2 border-dashed border-black/50" />
        <Row label="Subtotal" value={<Money value={sale.subtotal} />} />
        <Row label="Discount" value={<Money value={sale.discountTotal} />} />
        <Row label={`Tax (${sale.taxRate}%)`} value={<Money value={sale.taxTotal} />} />
        <Row
          label={<strong>TOTAL</strong>}
          value={
            <strong>
              <Money value={sale.grandTotal} />
            </strong>
          }
        />
        <hr className="my-2 border-dashed border-black/50" />
        <Row
          label={
            sale.paymentMethod === "CASH" ? "Cash tendered" : `Recorded (${sale.paymentMethod})`
          }
          value={<Money value={sale.tendered ?? sale.grandTotal} />}
        />
        {sale.paymentReference && <Row label="Reference" value={sale.paymentReference} />}
        {sale.change != null && <Row label="Change" value={<Money value={sale.change} />} />}
        <hr className="my-2 border-dashed border-black/50" />
        <p className="whitespace-pre-line text-center">
          {sale.receiptFooter ?? "Thank you for shopping!"}
        </p>
        <p className="text-center text-[10px]">Recorded by OrderSync.</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
