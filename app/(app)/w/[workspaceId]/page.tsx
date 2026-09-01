import { PageContainer } from "@noirly-dev/ui";
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
    <PageContainer size="lg">
      <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--accent)]">
        TEAM · {workspace.role.toUpperCase()}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{workspace.name}</h1>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        Base currency{" "}
        <span className="font-mono text-[var(--foreground)]">{workspace.baseCurrency}</span>.
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
            className="surface grain relative rounded-[var(--r-lg)] border border-[var(--hairline)] shadow-[var(--elev-1)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--accent)]/40"
          >
            <p className="text-sm font-medium text-[var(--foreground)]">{card.label}</p>
          </Link>
        ))}
      </div>

      <PoolListPreview workspaceId={workspaceId} />
    </PageContainer>
  );
}
