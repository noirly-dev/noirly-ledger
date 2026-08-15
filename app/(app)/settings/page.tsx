import Link from "next/link";
import { getLedgerProvider } from "@/src/server/api/http";

export default async function SettingsPage() {
  const { ctx } = await getLedgerProvider();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <dl className="mt-6 space-y-4 rounded-xl border border-nl-border bg-nl-surface p-5 text-sm">
        <div>
          <dt className="text-[#737373]">Display name</dt>
          <dd className="mt-1 text-[#F5F5F5]">{ctx.displayName}</dd>
        </div>
        <div>
          <dt className="text-[#737373]">Email</dt>
          <dd className="mt-1 font-mono text-[#F5F5F5]">{ctx.email}</dd>
        </div>
        <div>
          <dt className="text-[#737373]">Base currency</dt>
          <dd className="mt-1 font-mono text-nl-accent">{ctx.baseCurrency}</dd>
        </div>
      </dl>
      <Link
        href="/settings/currency"
        className="mt-6 inline-block text-sm text-nl-accent hover:underline"
      >
        Manage FX rates →
      </Link>
    </main>
  );
}
