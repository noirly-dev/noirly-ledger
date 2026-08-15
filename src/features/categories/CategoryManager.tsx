"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { Button } from "@/src/ui/Button";
import { Input, Label } from "@/src/ui/Field";

type Props = { workspaceId: string };

export function CategoryManager({ workspaceId }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#52D3FE");
  const categories = useQuery({
    queryKey: qk.categories(workspaceId),
    queryFn: () => api.listCategories(workspaceId),
  });

  const create = useMutation({
    mutationFn: () => api.createCategory(workspaceId, { name, color, icon: "circle" }),
    onSuccess: () => {
      setName("");
      void queryClient.invalidateQueries({ queryKey: qk.categories(workspaceId) });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteCategory(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: qk.categories(workspaceId) }),
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
      <form
        className="mt-6 flex flex-col gap-3 rounded-xl border border-nl-border bg-nl-surface p-4 sm:flex-row sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <div className="flex-1">
          <Label htmlFor="cat-name">Name</Label>
          <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="cat-color">Color</Label>
          <Input
            id="cat-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 p-1"
          />
        </div>
        <Button type="submit" disabled={create.isPending}>
          Add
        </Button>
      </form>
      <ul className="mt-6 divide-y divide-nl-border rounded-xl border border-nl-border">
        {(categories.data?.categories ?? []).map((category) => (
          <li key={category.id} className="flex items-center justify-between px-4 py-3">
            <span className="flex items-center gap-3 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: category.color }}
                aria-hidden
              />
              {category.name}
              {category.isSystem ? (
                <span className="font-mono text-[10px] text-[#737373]">SYSTEM</span>
              ) : null}
            </span>
            <button
              type="button"
              className="text-xs text-[#737373] hover:text-nl-negative"
              onClick={() => remove.mutate(category.id)}
            >
              {category.isSystem ? "Archive" : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
