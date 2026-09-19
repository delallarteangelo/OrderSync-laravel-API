import * as React from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Camera, LoaderCircle, ScanBarcode, TriangleAlert } from "lucide-react";
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
  onScan: (code: string) => void | Promise<void>;
};

type ScannerState = "starting" | "scanning" | "error";

function cameraErrorMessage(error: unknown): string {
  if (!window.isSecureContext) {
    return "Camera scanning requires HTTPS or localhost. Open OrderSync through a secure address and try again.";
  }

  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Camera permission was denied. Allow camera access for OrderSync in your browser settings, then try again.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No camera was found on this device.";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "The camera is already in use by another app or browser tab.";
    }
  }

  return "The camera could not be started. Check your browser camera permission and try again.";
}

export function WebcamScannerDialog({ open, onOpenChange, onScan }: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [videoElement, setVideoElement] = React.useState<HTMLVideoElement | null>(null);
  const controlsRef = React.useRef<IScannerControls | null>(null);
  const detectedRef = React.useRef(false);
  const [scannerState, setScannerState] = React.useState<ScannerState>("starting");
  const [errorMessage, setErrorMessage] = React.useState("");

  const setVideoNode = React.useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    setVideoElement(element);
  }, []);

  const stopScanner = React.useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;

    const video = videoRef.current;
    const stream = video?.srcObject;
    if (typeof MediaStream !== "undefined" && stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (video) video.srcObject = null;
  }, []);

  React.useEffect(() => {
    if (!open) {
      stopScanner();
      return;
    }

    let cancelled = false;
    detectedRef.current = false;
    setScannerState("starting");
    setErrorMessage("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerState("error");
      setErrorMessage(
        window.isSecureContext
          ? "This browser does not support camera scanning. Use a current version of Chrome, Edge, or Safari."
          : cameraErrorMessage(null),
      );
      return;
    }

    const video = videoElement;
    if (!video) return;

    const reader = new BrowserMultiFormatReader(undefined, {
      delayBetweenScanAttempts: 150,
      delayBetweenScanSuccess: 500,
    });

    void reader
      .decodeFromConstraints(
        {
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        video,
        (result) => {
          if (!result || cancelled || detectedRef.current) return;

          const code = result.getText().trim();
          if (!code) return;

          detectedRef.current = true;
          stopScanner();
          onOpenChange(false);
          void onScan(code);
        },
      )
      .then((controls) => {
        if (cancelled || detectedRef.current) {
          controls.stop();
          return;
        }
        controlsRef.current = controls;
        setScannerState("scanning");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        stopScanner();
        setScannerState("error");
        setErrorMessage(cameraErrorMessage(error));
      });

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [onOpenChange, onScan, open, stopScanner, videoElement]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Scan product barcode</DialogTitle>
          <DialogDescription>
            Point the camera at the product barcode. The product is added to the cart as soon as the
            code is recognized.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
          <video
            ref={setVideoNode}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            aria-label="Live camera barcode scanner"
          />

          {scannerState !== "error" && (
            <>
              <div className="pointer-events-none absolute inset-x-[12%] top-1/2 h-0.5 -translate-y-1/2 bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.75)]" />
              <div className="pointer-events-none absolute inset-[16%] rounded-lg border-2 border-white/70" />
            </>
          )}

          {scannerState === "starting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 text-white">
              <LoaderCircle className="h-8 w-8 animate-spin" />
              <span className="text-sm">Starting camera…</span>
            </div>
          )}

          {scannerState === "error" && (
            <div
              role="alert"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black px-8 text-center text-white"
            >
              <TriangleAlert className="h-9 w-9 text-amber-400" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {scannerState === "scanning" && (
            <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded bg-black/70 px-2 py-1 text-xs text-white">
              <ScanBarcode className="h-3.5 w-3.5" />
              Looking for a barcode…
            </span>
          )}

          <Camera className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-white/70" />
        </div>

        <p className="text-xs text-muted-foreground">
          Camera access is used only while this window is open. You can still type a SKU or barcode
          in the POS field if the camera is unavailable.
        </p>
      </DialogContent>
    </Dialog>
  );
}
