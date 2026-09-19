import { http } from "./axios";
import type { PlatformBusiness } from "@/shared/types/platform";

export type BusinessRegistrationPayload = {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
  timezone: string;
  planCode?: "BASIC" | "STANDARD" | "PREMIUM";
};

export type BusinessRegistrationResult = {
  business: PlatformBusiness;
  application: { id: string };
  applicationToken: string;
};

export async function registerBusiness(
  payload: BusinessRegistrationPayload,
): Promise<BusinessRegistrationResult> {
  const { data } = await http.post<BusinessRegistrationResult>(
    "/business-registrations",
    payload,
    {
      _skipRefresh: true,
    },
  );
  return data;
}
