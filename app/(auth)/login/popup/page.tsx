"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { LedgerBusyScreen } from "@/src/components/LedgerBusyScreen";

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/home";
}

function LoginPopupInner() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  useEffect(() => {
    void signIn(
      "noirly",
      {
        redirectTo: `/login/popup-complete?next=${encodeURIComponent(next)}`,
        callbackUrl: `/login/popup-complete?next=${encodeURIComponent(next)}`,
      },
      { display: "popup", prompt: "select_account" },
    );
  }, [next]);

  return <LedgerBusyScreen label="Signing in to Ledger" />;
}

export default function LoginPopupPage() {
  return (
    <Suspense fallback={<LedgerBusyScreen label="Signing in to Ledger" />}>
      <LoginPopupInner />
    </Suspense>
  );
}
