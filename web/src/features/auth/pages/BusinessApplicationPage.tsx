import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getBusinessApplication, resumeBusinessApplication, submitBusinessApplicationPayment } from "@/shared/api/subscriptionApplications";
import type { WalletMethod } from "@/shared/types/payments";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

export function BusinessApplicationPage() {
  const { id = "" } = useParams();
  const [token, setToken] = React.useState(() => sessionStorage.getItem(`ordersync-application-${id}`) ?? "");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [method, setMethod] = React.useState<WalletMethod>("GCASH");
  const [reference, setReference] = React.useState("");
  const [proof, setProof] = React.useState<File>();
  const queryClient = useQueryClient();
  const application = useQuery({ queryKey: ["business-application", id, token], queryFn: () => getBusinessApplication(id, token), enabled: !!id && !!token, refetchInterval: 30_000 });
  const resume = useMutation({
    mutationFn: () => resumeBusinessApplication(email, password),
    onSuccess: (result) => {
      if (result.id !== id) { toast.error("These credentials belong to another application."); return; }
      sessionStorage.setItem(`ordersync-application-${id}`, result.applicationToken);
      setToken(result.applicationToken);
      setPassword("");
    },
    onError: () => toast.error("Application credentials could not be verified."),
  });
  const submit = useMutation({
    mutationFn: () => submitBusinessApplicationPayment(id, token, method, reference, proof!),
    onSuccess: () => { toast.success("Payment proof submitted for review."); setProof(undefined); setReference(""); void queryClient.invalidateQueries({ queryKey: ["business-application", id] }); },
    onError: (error) => toast.error(error.message),
  });
  const current = application.data?.application;
  return <main className="min-h-screen bg-muted/30 p-5">
    <div className="mx-auto max-w-2xl space-y-4">
      <Card><CardHeader><CardTitle>Business application</CardTitle></CardHeader><CardContent className="space-y-4">
        {!token ? <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); resume.mutate(); }}>
          <p className="text-sm text-muted-foreground">Sign in with the owner credentials used at registration to resume this application.</p>
          <Label htmlFor="application-email">Owner email</Label><Input id="application-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Label htmlFor="application-password">Password</Label><Input id="application-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" disabled={resume.isPending}>Resume application</Button>
        </form> : application.isLoading ? <p>Loading application…</p> : application.isError ? <p className="text-destructive">Application could not be loaded. Try resuming with owner credentials.</p> : current ? <>
          <p><strong>{current.businessName}</strong> · {current.desiredPlan.name} · {current.status.replaceAll("_", " ")}</p>
          <p className="text-sm text-muted-foreground">Application ID: {current.id}. Keep this page for status updates; you can resume using your registration credentials.</p>
          {current.status === "PENDING_REVIEW" && <p>OrderSync will review your business before asking for payment.</p>}
          {current.status === "PAYMENT_SUBMITTED" && <p>Your proof is under manual review. The plan will activate only when the receiving wallet transaction is verified.</p>}
          {current.status === "APPROVED" && <p>Your business and plan are active. <Link className="text-primary underline" to="/login">Sign in</Link>.</p>}
          {current.status === "REJECTED" && <p className="text-destructive">Application rejected: {current.rejectionReason}</p>}
          {current.status === "AWAITING_PAYMENT" && <div className="space-y-3 rounded-lg border p-4">
            <p className="font-semibold">Amount due: ₱{(current.amountDueMinor / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
            <p className="text-sm">Pay only to an OrderSync platform wallet below, then submit the transaction reference and proof. The business owner’s customer wallet is not used for subscription fees.</p>
            {application.data?.wallets.map((wallet) => <div key={wallet.id} className="rounded border p-3 text-sm">{wallet.method}: {wallet.accountName} · {wallet.accountNumber}</div>)}
            {!application.data?.wallets.length && <p className="text-destructive">No receiving wallet is available. Contact OrderSync administration before paying.</p>}
            {!!application.data?.wallets.length && <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); submit.mutate(); }}>
              <Label htmlFor="application-method">Wallet used</Label><select id="application-method" className="w-full rounded border p-2" value={method} onChange={(event) => setMethod(event.target.value as WalletMethod)}>{application.data.wallets.map((wallet) => <option key={wallet.id} value={wallet.method}>{wallet.method}</option>)}</select>
              <Label htmlFor="application-reference">Transaction reference</Label><Input id="application-reference" value={reference} onChange={(event) => setReference(event.target.value)} required />
              <Label htmlFor="application-proof">Payment proof (JPG, PNG, WebP or PDF; max 5 MB)</Label><Input id="application-proof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setProof(event.target.files?.[0])} required />
              <Button type="submit" disabled={submit.isPending || !proof || !reference.trim()}>Submit proof for review</Button>
            </form>}
          </div>}
          <Button variant="outline" onClick={() => void application.refetch()}>Refresh status</Button>
        </> : null}
      </CardContent></Card>
      <Link className="text-sm text-primary underline" to="/login">Back to sign in</Link>
    </div>
  </main>;
}
