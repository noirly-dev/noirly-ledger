"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { MoneyText } from "@/src/ui/MoneyText";
import { Button } from "@/src/ui/Button";
import { useUIStore } from "@/src/stores/ui-store";

type Props = {
  workspaceId: string;
  baseCurrency: string;
  recurringOnly?: boolean;
};

export function TransactionScreen({
  workspaceId,
  baseCurrency,
  recurringOnly = false,
}: Props) {
  const setOpen = useUIStore((s) => s.setTransactionComposerOpen);
  const queryClient = useQueryClient();
  const parentRef = useRef<HTMLDivElement>(null);
  const categories = useQuery({
    queryKey: qk.categories(workspaceId),
    queryFn: () => api.listCategories(workspaceId),
  });
  const txns = useQuery({
    queryKey: qk.transactions(workspaceId, { recurring: recurringOnly }),
    queryFn: () =>
      api.listTransactions(workspaceId, { recurring: recurringOnly, limit: 200 }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteTransaction(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions", workspaceId] }),
  });

  const items = txns.data?.items ?? [];
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 12,
  });

  const categoryName = (id: string | null) =>
    categories.data?.categories.find((c) => c.id === id)?.name ?? "Uncategorized";

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {recurringOnly ? "Recurring" : "Transactions"}
          </h1>
          <p className="mt-1 text-sm text-[#A3A3A3]">
            Amounts in original currency; base {baseCurrency} is stored on save.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Add</Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-nl-border">
        <div className="grid grid-cols-[7rem_1fr_1fr_6rem_8rem_4rem] border-b border-nl-border bg-nl-surface px-4 py-3 text-[11px] uppercase tracking-wide text-[#737373]">
          <span>Date</span>
          <span>Category</span>
          <span>Note</span>
          <span>Type</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
        <div ref={parentRef} className="max-h-[32rem] overflow-auto">
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[#737373]">
              No transactions yet.
            </p>
          ) : (
            <div
              className="relative w-full"
              style={{ height: `${virtualizer.getTotalSize()}px` }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const txn = items[virtualRow.index]!;
                return (
                  <div
                    key={txn.id}
                    className="absolute left-0 grid w-full grid-cols-[7rem_1fr_1fr_6rem_8rem_4rem] items-center border-b border-nl-border px-4 text-sm last:border-0"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <span className="font-mono tabular-nums text-[#A3A3A3]">
                      {txn.date}
                    </span>
                    <span>{categoryName(txn.categoryId)}</span>
                    <span className="truncate text-[#A3A3A3]">{txn.note ?? "—"}</span>
                    <span className="capitalize text-[#A3A3A3]">{txn.type}</span>
                    <span className="text-right">
                      <MoneyText
                        amountMinor={
                          txn.type === "expense" ? -txn.amountMinor : txn.amountMinor
                        }
                        currency={txn.currency}
                        tone={
                          txn.type === "income"
                            ? "positive"
                            : txn.type === "expense"
                              ? "negative"
                              : "default"
                        }
                      />
                    </span>
                    <span className="text-right">
                      <button
                        type="button"
                        className="text-xs text-[#737373] hover:text-nl-negative"
                        onClick={() => remove.mutate(txn.id)}
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
