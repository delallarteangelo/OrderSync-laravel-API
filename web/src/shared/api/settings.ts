import { http } from "./axios";
import type { BusinessSettings } from "@/shared/types/settings";

export async function getSettings(): Promise<BusinessSettings> {
  const { data } = await http.get<BusinessSettings>("/settings");
  return data;
}

export async function updateSettings(
  payload: Partial<BusinessSettings>,
): Promise<BusinessSettings> {
  const { data } = await http.put<BusinessSettings>("/settings", payload);
  return data;
}
