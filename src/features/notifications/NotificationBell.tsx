"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const query = useQuery({
    queryKey: qk.notifications,
    queryFn: () => api.listNotifications(),
    refetchInterval: 30_000,
  });

  const read = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.notifications });
    },
  });

  const items = query.data?.notifications ?? [];
  const unread = items.filter((item) => !item.readAt).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg border border-nl-border px-3 py-1.5 text-sm text-[#A3A3A3] hover:text-[#F5F5F5]"
        aria-label="Notifications"
      >
        Alerts
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-nl-accent px-1 font-mono text-[10px] text-[#0A0A0A]">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-nl-border bg-nl-surface shadow-xl">
          <p className="border-b border-nl-border px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-[#737373]">
            Notifications
          </p>
          <ul className="max-h-80 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="border-b border-nl-border last:border-0">
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (!item.readAt) read.mutate(item.id);
                      setOpen(false);
                    }}
                    className="block px-3 py-2 hover:bg-[#121212]"
                  >
                    <p className="text-sm text-[#F5F5F5]">{item.title}</p>
                    <p className="text-xs text-[#737373]">{item.body}</p>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left hover:bg-[#121212]"
                    onClick={() => {
                      if (!item.readAt) read.mutate(item.id);
                    }}
                  >
                    <p className="text-sm text-[#F5F5F5]">{item.title}</p>
                    <p className="text-xs text-[#737373]">{item.body}</p>
                  </button>
                )}
              </li>
            ))}
          </ul>
          {items.length === 0 ? (
            <p className="px-3 py-6 text-sm text-[#737373]">No notifications</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
