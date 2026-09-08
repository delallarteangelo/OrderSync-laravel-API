import { http } from "./axios";
import type { PlatformBusiness } from "@/shared/types/platform";

export type BusinessRegistrationPayload = {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
  timezone: string;
};

export async function registerBusiness(
  payload: BusinessRegistrationPayload,
): Promise<PlatformBusiness> {
  const { data } = await http.post<{ business: PlatformBusiness }>(
    "/business-registrations",
    payload,
    {
      _skipRefresh: true,
    },
  );
  return data.business;
}
