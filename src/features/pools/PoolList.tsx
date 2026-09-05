"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { useCan } from "@/src/features/workspace/WorkspaceRoleContext";
import { PoolMeter } from "@/src/features/pools/PoolMeter";
import { Button, PageContainer } from "@noirly-dev/ui";
import { Input, Label, Textarea } from "@noirly-dev/ui";

type Props = {
  workspaceId: string;
  baseCurrency: string;
};

export function PoolList({ workspaceId, baseCurrency }: Props) {
  const queryClient = useQueryClient();
  const canManage = useCan("pool.manage");
  const [name, setName] = useState("");
  const [limitMajor, setLimitMajor] = useState("");
  const [description, setDescription] = useState("");

  const poolsQuery = useQuery({
    queryKey: qk.budgetPools(workspaceId),
    queryFn: () => api.listPools(workspaceId),
  });

  const create = useMutation({
    mutationFn: () =>
      api.createPool(workspaceId, {
        name,
        description: description || null,
        limitMajor,
        currency: baseCurrency,
      }),
    onSuccess: () => {
      setName("");
      setLimitMajor("");
      setDescription("");
      void queryClient.invalidateQueries({ queryKey: qk.budgetPools(workspaceId) });
    },
  });

  const pools = poolsQuery.data?.pools ?? [];

  return (
    <PageContainer size="md">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Budget pools</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Team spend posts to a pool only after approval.
          </p>
        </div>
        <Link
          href={`/w/${workspaceId}/expenses/new`}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Submit expense
        </Link>
      </div>

      {canManage ? (
        <form
          className="mt-6 space-y-3 surface grain rounded-[var(--r-lg)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate();
          }}
        >
          <p className="text-sm font-medium">New pool</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="pool-name">Name</Label>
              <Input
                id="pool-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="pool-limit">Limit ({baseCurrency})</Label>
              <Input
                id="pool-limit"
                inputMode="decimal"
                value={limitMajor}
                onChange={(e) => setLimitMajor(e.target.value)}
                placeholder="5000.00"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="pool-desc">Description</Label>
            <Textarea
              id="pool-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {create.isError ? (
            <p className="text-sm text-[var(--balance-negative)]" role="alert">
              {(create.error as Error).message}
            </p>
          ) : null}
          <Button type="submit" disabled={create.isPending || !name.trim() || !limitMajor}>
            {create.isPending ? "Creating…" : "Create pool"}
          </Button>
        </form>
      ) : null}

      <ul className="mt-6 grid gap-3">
        {pools.map((pool) => (
          <li key={pool.id}>
            <Link
              href={`/w/${workspaceId}/pools/${pool.id}`}
              className="block surface grain rounded-[var(--r-lg)] p-4 surface-interactive"
            >
              <p className="text-sm font-medium text-[var(--foreground)]">{pool.name}</p>
              {pool.description ? (
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{pool.description}</p>
              ) : null}
              <div className="mt-3">
                <PoolMeter pool={pool} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {poolsQuery.isLoading ? (
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">Loading pools…</p>
      ) : null}
      {!poolsQuery.isLoading && pools.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--muted-foreground)]">No pools yet.</p>
      ) : null}
    </PageContainer>
  );
}
