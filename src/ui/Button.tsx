import { cn } from "@/src/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50",
        variant === "primary" && "bg-nl-accent text-[#0A0A0A] hover:bg-[#7adefe]",
        variant === "ghost" &&
          "border border-nl-border text-[#A3A3A3] hover:bg-nl-surface hover:text-[#F5F5F5]",
        variant === "danger" &&
          "border border-nl-negative text-nl-negative hover:bg-nl-negative/10",
        className,
      )}
      {...props}
    />
  );
}
