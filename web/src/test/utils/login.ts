import { http as axios } from "@/shared/api/axios";
import { useAuthStore } from "@/app/stores/authStore";

export async function loginAs(email: string, password = "password") {
  const { data } = await axios.post("/auth/login", { email, password });
  useAuthStore.setState({
    accessToken: data.accessToken,
    user: data.user,
    bootstrapped: true,
  });
  return data;
}

export async function loginAsAdmin() {
  return loginAs("tonette@minimart.ph");
}

export async function loginAsCashier() {
  return loginAs("maria.cashier@minimart.ph");
}

export function logout() {
  useAuthStore.setState({ accessToken: null, user: null, bootstrapped: false });
}
