import * as React from "react";

export function usePrintReceipt() {
  return React.useCallback(() => window.print(), []);
}
