import * as React from "react";
import { Toaster } from "sonner";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        richColors
        closeButton
        position="top-right"
        toastOptions={{
          duration: 5_000,
          classNames: {
            toast: "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          },
        }}
      />
    </>
  );
}
