import { Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WebcamScannerDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Webcam scanner (mock)</DialogTitle>
          <DialogDescription>
            In production, this view streams from <code>getUserMedia()</code> and decodes EAN/Code-128
            in real-time. For this prototype, use the scan input or type a SKU and press Enter.
          </DialogDescription>
        </DialogHeader>
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-md border bg-black text-white">
          <Camera className="h-10 w-10 opacity-40" />
          <div className="absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2 bg-emerald-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.6)]" />
          <span className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-0.5 text-xs">
            CAM 01 · idle
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
