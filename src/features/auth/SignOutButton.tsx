"use client";

import { signOutAction } from "@/src/features/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        className="w-full rounded-lg border border-nl-border px-3 py-1.5 text-left text-sm text-[#A3A3A3] hover:bg-nl-surface hover:text-[#F5F5F5]"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
