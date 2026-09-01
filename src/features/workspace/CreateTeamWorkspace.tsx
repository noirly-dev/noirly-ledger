"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/src/lib/api-client";

export function CreateTeamWorkspace() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { workspace } = await api.createWorkspace({ name });
      setOpen(false);
      setName("");
      router.push(`/w/${workspace.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--accent)] hover:bg-[var(--surface)]"
      >
        + New team workspace
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-3">
      <label className="block text-xs text-[var(--muted-foreground)]" htmlFor="team-name">
        Team name
      </label>
      <input
        id="team-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        placeholder="Marketing"
        required
        autoFocus
      />
      {error ? <p className="text-xs text-[var(--balance-negative)]">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-[var(--accent-ink)] disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-md border border-[var(--hairline)] px-3 py-1.5 text-sm text-[var(--muted-foreground)]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
