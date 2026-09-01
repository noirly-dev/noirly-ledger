"use client";

import type { BudgetPool } from "@/src/core/sync/types";
import { MoneyText } from "@/src/components/MoneyText";
import { ProgressBar } from "@/src/components/ProgressBar";

export function poolUsage(pool: BudgetPool) {
  const remaining = pool.limitAmountMinor - pool.currentSpendMinor;
  const ratio =
    pool.limitAmountMinor <= 0
      ? 0
      : pool.currentSpendMinor / pool.limitAmountMinor;
  const over = remaining < 0;
  return { remaining, ratio, over };
}

export function PoolMeter({ pool }: { pool: BudgetPool }) {
  const { remaining, ratio, over } = poolUsage(pool);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <MoneyText
          amountMinor={pool.currentSpendMinor}
          currency={pool.currency}
        />
        <span className="text-xs text-[var(--muted-foreground)]">
          of <MoneyText amountMinor={pool.limitAmountMinor} currency={pool.currency} />
        </span>
      </div>
      <ProgressBar value={ratio} tone={over ? "negative" : "accent"} />
      <p className="text-xs text-[var(--muted-foreground)]">
        {over ? "Over by " : "Remaining "}
        <MoneyText
          amountMinor={Math.abs(remaining)}
          currency={pool.currency}
          tone={over ? "negative" : "positive"}
        />
      </p>
    </div>
  );
}
