import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WebcamScannerDialog } from "../WebcamScannerDialog";

const scannerMocks = vi.hoisted(() => ({
  decodeFromConstraints: vi.fn(),
  stop: vi.fn(),
}));

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: vi.fn().mockImplementation(() => ({
    decodeFromConstraints: scannerMocks.decodeFromConstraints,
  })),
}));

describe("WebcamScannerDialog", () => {
  beforeEach(() => {
    scannerMocks.decodeFromConstraints.mockReset();
    scannerMocks.stop.mockReset();
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: vi.fn() },
    });
  });

  it("starts the camera decoder and returns the first detected barcode", async () => {
    let decodeCallback: ((result: { getText: () => string } | undefined) => void) | undefined;
    scannerMocks.decodeFromConstraints.mockImplementation(
      (_constraints, _video, callback: typeof decodeCallback) => {
        decodeCallback = callback;
        return Promise.resolve({ stop: scannerMocks.stop });
      },
    );
    const onOpenChange = vi.fn();
    const onScan = vi.fn();

    render(<WebcamScannerDialog open onOpenChange={onOpenChange} onScan={onScan} />);

    await waitFor(() => expect(scannerMocks.decodeFromConstraints).toHaveBeenCalledOnce());
    expect(screen.getByText("Looking for a barcode…")).toBeInTheDocument();

    act(() => decodeCallback?.({ getText: () => " 4801234567890 " }));

    expect(scannerMocks.stop).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onScan).toHaveBeenCalledWith("4801234567890");
  });

  it("shows an actionable message when camera permission is denied", async () => {
    scannerMocks.decodeFromConstraints.mockRejectedValue(
      new DOMException("Permission denied", "NotAllowedError"),
    );

    render(<WebcamScannerDialog open onOpenChange={vi.fn()} onScan={vi.fn()} />);

    expect(await screen.findByText(/Camera permission was denied/i)).toBeInTheDocument();
  });
});
