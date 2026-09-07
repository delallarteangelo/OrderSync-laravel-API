import * as React from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import type { ReportBucket } from "@/shared/types/reports";

export interface BucketSelectorProps {
  value: ReportBucket;
  onChange: (v: ReportBucket) => void;
}

export function BucketSelector({ value, onChange }: BucketSelectorProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ReportBucket)}>
      <TabsList>
        <TabsTrigger value="day">Day</TabsTrigger>
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
