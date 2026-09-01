"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { BudgetPoolRealtime } from "@/src/features/realtime/BudgetPoolRealtime";
import { PoolMeter } from "@/src/features/pools/PoolMeter";
import { MoneyText } from "@/src/components/MoneyText";

type Props = {
  workspaceId: string;
  poolId: string;
};

export function PoolDetail({ workspaceId, poolId }: Props) {
  const poolQuery = useQuery({
    queryKey: qk.budgetPool(poolId),
    queryFn: () => api.getPool(poolId),
  });
  const expensesQuery = useQuery({
    queryKey: qk.transactions(workspaceId, { budgetPoolId: poolId }),
    queryFn: () => api.listExpenses(workspaceId, poolId),
  });

  const pool = poolQuery.data?.pool;
  const items = expensesQuery.data?.items ?? [];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <p className="font-mono text-[11px] tracking-[0.2em] text-[var(--accent)]">POOL</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {pool?.name ?? "Budget pool"}
          </h1>
          {pool?.description ? (
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{pool.description}</p>
          ) : null}
        </div>
        <BudgetPoolRealtime workspaceId={workspaceId} poolId={poolId} />
      </div>

      {pool ? (
        <div className="mt-6 surface grain relative rounded-[var(--r-lg)] border border-[var(--hairline)] shadow-[var(--elev-1)] bg-[var(--surface)] p-4">
          <PoolMeter pool={pool} />
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-medium">Expenses</h2>
        <Link
          href={`/w/${workspaceId}/expenses/new?poolId=${poolId}`}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Submit expense
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-[var(--hairline)] overflow-hidden surface grain relative rounded-[var(--r-lg)] border border-[var(--hairline)] shadow-[var(--elev-1)] bg-[var(--surface)]">
        {items.map((txn) => (
          <li key={txn.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm text-[var(--foreground)]">{txn.note || "Expense"}</p>
              <p className="font-mono text-[11px] text-[var(--muted-foreground)]">
                {txn.date} · {txn.isPosted ? "posted" : "pending"}
              </p>
            </div>
            <MoneyText amountMinor={txn.amountMinor} currency={txn.currency} />
          </li>
        ))}
      </ul>
      {items.length === 0 && !expensesQuery.isLoading ? (
        <p className="mt-4 text-sm text-[var(--muted-foreground)]">No expenses against this pool yet.</p>
      ) : null}
    </main>
  );
}
