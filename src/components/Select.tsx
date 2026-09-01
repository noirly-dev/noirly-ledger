import { cn } from "@/src/lib/cn";
import type { SelectHTMLAttributes } from "react";

const selectClass =
  "flex h-10 w-full rounded-xl border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(selectClass, className)} {...props} />;
}
