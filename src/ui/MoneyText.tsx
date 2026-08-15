import type { MoneyMinor } from "@/src/core/money";
import { formatMinorToMajor } from "@/src/core/money";
import { cn } from "@/src/lib/cn";

type Props = {
  amountMinor: MoneyMinor;
  currency: string;
  tone?: "default" | "positive" | "negative";
  className?: string;
};

export function MoneyText({
  amountMinor,
  currency,
  tone = "default",
  className,
}: Props) {
  return (
    <span
      className={cn(
        "font-mono tabular-nums tracking-tight",
        tone === "positive" && "text-nl-positive",
        tone === "negative" && "text-nl-negative",
        className,
      )}
    >
      {formatMinorToMajor(amountMinor)} {currency}
    </span>
  );
}
