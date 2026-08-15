"use client";

import {
  useChannel,
  usePresence,
  useRealtimeClient,
  useRealtimeEvent,
  useRealtimeStatus,
} from "@noirly-dev/realtime-client/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { shouldApplyLww } from "@noirly-dev/realtime-shared";
import { qk } from "@/src/core/sync/query-keys";
import type { ApprovalRequest, BudgetPool, Transaction } from "@/src/core/sync/types";
import { setLedgerRealtimeScope } from "@/src/features/realtime/LedgerRealtimeProvider";
import { PresenceAvatars } from "@/src/features/realtime/PresenceAvatars";

type Payload = {
  approval: ApprovalRequest;
  transaction: Transaction;
  pool?: BudgetPool;
  poolId?: string;
  version: number;
};

function BudgetPoolRealtimeConnected({
  workspaceId,
  poolId,
}: {
  workspaceId: string;
  poolId: string;
}) {
  const client = useRealtimeClient();
  const status = useRealtimeStatus();
  const queryClient = useQueryClient();
  const channel = `workspace:${workspaceId}:budgetpool:${poolId}`;

  useEffect(() => {
    setLedgerRealtimeScope(workspaceId);
    void client.connect().catch(() => undefined);
  }, [client, workspaceId]);

  useChannel(channel, { presence: true });
  const { members } = usePresence(channel, { collapseByUserId: true });

  function applyPool(pool: BudgetPool) {
    queryClient.setQueryData(
      qk.budgetPool(poolId),
      (old: { pool: BudgetPool } | undefined) => {
        const current = old?.pool;
        if (
          current &&
          !shouldApplyLww(
            { version: Date.parse(pool.updatedAt) },
            { version: Date.parse(current.updatedAt) },
          )
        ) {
          return old;
        }
        return { pool };
      },
    );
    queryClient.setQueryData(
      qk.budgetPools(workspaceId),
      (old: { pools: BudgetPool[] } | undefined) =>
        old
          ? { pools: old.pools.map((item) => (item.id === pool.id ? pool : item)) }
          : old,
    );
  }

  useRealtimeEvent<Payload>(channel, "expense.approved", (data) => {
    if (data.pool) applyPool(data.pool);
    void queryClient.invalidateQueries({ queryKey: qk.approvals(workspaceId) });
  });
  useRealtimeEvent<Payload>(channel, "expense.rejected", () => {
    void queryClient.invalidateQueries({ queryKey: qk.approvals(workspaceId) });
  });
  useRealtimeEvent<Payload>(channel, "expense.submitted", () => {
    void queryClient.invalidateQueries({ queryKey: qk.approvals(workspaceId) });
  });
  useRealtimeEvent<{ pool: BudgetPool; version: number }>(
    channel,
    "budget.updated",
    (data) => {
      applyPool(data.pool);
    },
  );

  return <PresenceAvatars members={members} status={status} />;
}

export function BudgetPoolRealtime({
  workspaceId,
  poolId,
}: {
  workspaceId: string;
  poolId: string;
}) {
  if (!process.env.NEXT_PUBLIC_REALTIME_WS_URL) return null;
  return (
    <BudgetPoolRealtimeConnected workspaceId={workspaceId} poolId={poolId} />
  );
}
