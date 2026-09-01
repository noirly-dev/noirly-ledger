import Link from "next/link";
import { getLedgerProvider } from "@/src/server/api/http";

export default async function SettingsPage() {
  const { ctx } = await getLedgerProvider();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <dl className="mt-6 space-y-4 surface grain relative rounded-[var(--r-lg)] border border-[var(--hairline)] shadow-[var(--elev-1)] bg-[var(--surface)] p-5 text-sm">
        <div>
          <dt className="text-[var(--muted-foreground)]">Display name</dt>
          <dd className="mt-1 text-[var(--foreground)]">{ctx.displayName}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Email</dt>
          <dd className="mt-1 font-mono text-[var(--foreground)]">{ctx.email}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted-foreground)]">Base currency</dt>
          <dd className="mt-1 font-mono text-[var(--accent)]">{ctx.baseCurrency}</dd>
        </div>
      </dl>
      <Link
        href="/settings/currency"
        className="mt-6 inline-block text-sm text-[var(--accent)] hover:underline"
      >
        Manage FX rates →
      </Link>
    </main>
  );
}
