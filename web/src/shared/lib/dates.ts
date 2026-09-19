import { formatDistanceToNow, parseISO } from "date-fns";

const PHILIPPINE_TIME_ZONE = "Asia/Manila";

function asDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

export function fmtDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: PHILIPPINE_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(asDate(value));
}

export function fmtDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: PHILIPPINE_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(asDate(value));
}

export function fmtTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: PHILIPPINE_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(asDate(value));
}

export function relative(value: string | Date): string {
  const d = asDate(value);
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function isoHoursAgo(hours: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

export function isoMinutesAgo(mins: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - mins);
  return d.toISOString();
}
