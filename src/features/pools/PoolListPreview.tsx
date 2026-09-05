"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { PoolMeter } from "@/src/features/pools/PoolMeter";

export function PoolListPreview({ workspaceId }: { workspaceId: string }) {
  const poolsQuery = useQuery({
    queryKey: qk.budgetPools(workspaceId),
    queryFn: () => api.listPools(workspaceId),
  });
  const pools = poolsQuery.data?.pools ?? [];

  if (poolsQuery.isLoading) {
    return <p className="mt-8 text-sm text-[var(--muted-foreground)]">Loading pools…</p>;
  }
  if (pools.length === 0) {
    return (
      <p className="mt-8 text-sm text-[var(--muted-foreground)]">
        No budget pools yet. Approvers can create one under Budget pools.
      </p>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium">Live remaining</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {pools.slice(0, 4).map((pool) => (
          <li key={pool.id}>
            <Link
              href={`/w/${workspaceId}/pools/${pool.id}`}
              className="block surface grain rounded-[var(--r-lg)] p-4 surface-interactive"
            >
              <p className="text-sm font-medium">{pool.name}</p>
              <div className="mt-3">
                <PoolMeter pool={pool} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
