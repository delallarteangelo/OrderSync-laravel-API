import { format, formatDistanceToNow, parseISO } from "date-fns";

export function fmtDate(value: string | Date, pattern = "MMM d, yyyy"): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  return format(d, pattern);
}

export function fmtDateTime(value: string | Date): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  return format(d, "MMM d, yyyy h:mm a");
}

export function fmtTime(value: string | Date): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  return format(d, "h:mm a");
}

export function relative(value: string | Date): string {
  const d = typeof value === "string" ? parseISO(value) : value;
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
