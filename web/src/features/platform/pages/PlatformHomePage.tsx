import { Building2, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/app/stores/authStore";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { logout as apiLogout } from "@/shared/api/auth";

export function PlatformHomePage() {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);

  const signOut = async () => {
    try {
      await apiLogout();
    } finally {
      clear();
      window.location.assign("/login");
    }
  };

  return (
    <main className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2 text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">OrderSync platform</h1>
              <p className="text-sm text-muted-foreground">Signed in as {user?.fullName}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void signOut()}>
            Sign out
          </Button>
        </header>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Platform administration
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Your Super Admin authorization is active. Business approval, subscription plans, and platform metrics are
            intentionally scheduled for Phase 3.
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
