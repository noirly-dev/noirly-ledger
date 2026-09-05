import { BrandMark } from "@/src/components/BrandMark";

/**
 * Full-screen hold while Identity does its part.
 *
 * The mark plus a single sweeping rule, rather than the three pulsing dots this
 * used to render — a blinking triple-dot reads as a stalled terminal, and the
 * sweep reads as progress. Both the sweep and the pulse are neutralised by the
 * global reduced-motion rule, leaving a static mark and the label.
 */
export function LedgerBusyScreen({ label }: { label: string }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--bg)]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-6 px-6">
        <BrandMark className="h-12 w-12" />
        <div className="skeleton h-0.5 w-32 rounded-full" />
        <p className="meta text-center">{label}</p>
      </div>
    </div>
  );
}
