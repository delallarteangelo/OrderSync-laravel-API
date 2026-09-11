import * as React from "react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";

type Props = {
  onScan: (code: string) => void;
};

export const ScanInput = React.forwardRef<HTMLInputElement, Props>(({ onScan }, ref) => {
  const [value, setValue] = React.useState("");

  const submit = () => {
    const v = value.trim();
    if (v.length === 0) return;
    onScan(v);
    setValue("");
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        ref={ref}
        autoFocus
        value={value}
        placeholder="Scan barcode or type SKU then Enter"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        className="font-mono"
      />
      <Button onClick={submit} variant="secondary">
        Add
      </Button>
    </div>
  );
});
ScanInput.displayName = "ScanInput";
