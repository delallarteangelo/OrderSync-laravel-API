import { useEffect, useRef } from "react";

/**
 * Mock barcode scanner hook.
 * Detects fast keystroke bursts terminated with Enter on the document,
 * mimicking a USB keyboard-wedge scanner.
 *
 * Also works perfectly when typing a SKU/barcode + Enter into the global
 * window when no input is focused.
 */
export function useBarcodeScanner(
  onScan: (code: string) => void,
  opts: { enabled?: boolean; maxIntervalMs?: number; minLength?: number } = {},
) {
  const { enabled = true, maxIntervalMs = 60, minLength = 4 } = opts;
  const bufferRef = useRef<string>("");
  const lastAtRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      const now = performance.now();
      if (now - lastAtRef.current > maxIntervalMs) {
        bufferRef.current = "";
      }
      lastAtRef.current = now;
      if (e.key === "Enter") {
        const code = bufferRef.current;
        bufferRef.current = "";
        if (code.length >= minLength) {
          onScan(code);
        }
        return;
      }
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled, maxIntervalMs, minLength, onScan]);
}
