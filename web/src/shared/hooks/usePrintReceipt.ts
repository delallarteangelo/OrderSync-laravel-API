export function usePrintReceipt() {
  return () => {
    window.print();
  };
}
