import Link from "next/link";
import { getLedgerProvider } from "@/src/server/api/http";
import { can } from "@/src/core/permissions/can";
import { PoolListPreview } from "@/src/features/pools/PoolListPreview";

export default async function WorkspaceHomePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { sync } = await getLedgerProvider();
  const workspace = await sync.getWorkspace(workspaceId);
  const canDecide = can(workspace.role, "expense.decide");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <p className="font-mono text-[11px] tracking-[0.2em] text-nl-accent">
        TEAM · {workspace.role.toUpperCase()}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{workspace.name}</h1>
      <p className="mt-2 text-sm text-[#A3A3A3]">
        Base currency{" "}
        <span className="font-mono text-[#F5F5F5]">{workspace.baseCurrency}</span>.
        Spend posts to a pool only after an approver decides.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: `/w/${workspaceId}/pools`, label: "Budget pools" },
          { href: `/w/${workspaceId}/expenses/new`, label: "Submit expense" },
          ...(canDecide
            ? [{ href: `/w/${workspaceId}/approvals`, label: "Approvals" }]
            : []),
          { href: `/w/${workspaceId}/members`, label: "Members" },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-nl-border bg-nl-surface p-5 transition-colors hover:border-nl-accent/40"
          >
            <p className="text-sm font-medium text-[#F5F5F5]">{card.label}</p>
          </Link>
        ))}
      </div>

      <PoolListPreview workspaceId={workspaceId} />
    </main>
  );
}
