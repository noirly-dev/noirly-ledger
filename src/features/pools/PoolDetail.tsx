"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { BudgetPoolRealtime } from "@/src/features/realtime/BudgetPoolRealtime";
import { PoolMeter } from "@/src/features/pools/PoolMeter";
import { MoneyText } from "@/src/ui/MoneyText";

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
      <p className="font-mono text-[11px] tracking-[0.2em] text-nl-accent">POOL</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {pool?.name ?? "Budget pool"}
          </h1>
          {pool?.description ? (
            <p className="mt-1 text-sm text-[#A3A3A3]">{pool.description}</p>
          ) : null}
        </div>
        <BudgetPoolRealtime workspaceId={workspaceId} poolId={poolId} />
      </div>

      {pool ? (
        <div className="mt-6 rounded-xl border border-nl-border bg-nl-surface p-4">
          <PoolMeter pool={pool} />
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-medium">Expenses</h2>
        <Link
          href={`/w/${workspaceId}/expenses/new?poolId=${poolId}`}
          className="text-sm text-nl-accent hover:underline"
        >
          Submit expense
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-nl-border overflow-hidden rounded-xl border border-nl-border bg-nl-surface">
        {items.map((txn) => (
          <li key={txn.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm text-[#F5F5F5]">{txn.note || "Expense"}</p>
              <p className="font-mono text-[11px] text-[#737373]">
                {txn.date} · {txn.isPosted ? "posted" : "pending"}
              </p>
            </div>
            <MoneyText amountMinor={txn.amountMinor} currency={txn.currency} />
          </li>
        ))}
      </ul>
      {items.length === 0 && !expensesQuery.isLoading ? (
        <p className="mt-4 text-sm text-[#737373]">No expenses against this pool yet.</p>
      ) : null}
    </main>
  );
}
