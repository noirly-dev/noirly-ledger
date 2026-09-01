"use client";

import { PageContainer } from "@noirly-dev/ui";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { MoneyText } from "@/src/components/MoneyText";

type Props = { workspaceId: string };

export function ExpenseList({ workspaceId }: Props) {
  const expenses = useQuery({
    queryKey: qk.transactions(workspaceId, { budgetPoolId: "team" }),
    queryFn: () => api.listExpenses(workspaceId),
  });
  const pools = useQuery({
    queryKey: qk.budgetPools(workspaceId),
    queryFn: () => api.listPools(workspaceId),
  });
  const poolName = new Map((pools.data?.pools ?? []).map((p) => [p.id, p.name]));
  const items = (expenses.data?.items ?? []).filter((txn) => txn.budgetPoolId);

  return (
    <PageContainer size="md">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Team expenses against budget pools.
          </p>
        </div>
        <Link href={`/w/${workspaceId}/expenses/new`}>
          <span className="inline-flex h-10 items-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-[var(--accent-ink)]">
            Submit expense
          </span>
        </Link>
      </div>
      <ul className="mt-6 divide-y divide-[var(--hairline)] overflow-hidden surface grain relative rounded-[var(--r-lg)] border border-[var(--hairline)] shadow-[var(--elev-1)] bg-[var(--surface)]">
        {items.map((txn) => (
          <li key={txn.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm text-[var(--foreground)]">{txn.note || "Expense"}</p>
              <p className="font-mono text-[11px] text-[var(--muted-foreground)]">
                {txn.date} · {poolName.get(txn.budgetPoolId ?? "") ?? "Pool"} ·{" "}
                {txn.isPosted ? "posted" : "pending"}
              </p>
            </div>
            <MoneyText amountMinor={txn.amountMinor} currency={txn.currency} />
          </li>
        ))}
      </ul>
      {items.length === 0 && !expenses.isLoading ? (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">No team expenses yet.</p>
      ) : null}
    </PageContainer>
  );
}
