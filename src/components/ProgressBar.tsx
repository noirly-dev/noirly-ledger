"use client";

import { motion } from "framer-motion";
import { cn } from "@/src/lib/cn";

type Props = {
  value: number;
  tone?: "positive" | "negative" | "accent";
};

export function ProgressBar({ value, tone = "accent" }: Props) {
  const pct = Math.min(Math.max(value, 0), 1);
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
    >
      <motion.div
        className={cn(
          "h-full rounded-full",
          tone === "accent" && "bg-[var(--accent)]",
          tone === "positive" && "bg-[var(--balance-positive)]",
          tone === "negative" && "bg-[var(--balance-negative)]",
        )}
        initial={false}
        animate={{ width: `${pct * 100}%` }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />
    </div>
  );
}
