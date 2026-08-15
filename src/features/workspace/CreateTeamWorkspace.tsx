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
        className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-nl-accent hover:bg-nl-surface"
      >
        + New team workspace
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 rounded-lg border border-nl-border bg-nl-surface p-3">
      <label className="block text-xs text-[#A3A3A3]" htmlFor="team-name">
        Team name
      </label>
      <input
        id="team-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-md border border-nl-border bg-[#121212] px-3 py-2 text-sm text-[#F5F5F5] outline-none focus:border-nl-accent"
        placeholder="Marketing"
        required
        autoFocus
      />
      {error ? <p className="text-xs text-nl-warning">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-nl-accent px-3 py-1.5 text-sm font-medium text-[#0A0A0A] disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-md border border-nl-border px-3 py-1.5 text-sm text-[#A3A3A3]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
