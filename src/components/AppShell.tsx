"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { SignOutButton } from "@/src/features/auth/SignOutButton";
import { CreateTeamWorkspace } from "@/src/features/workspace/CreateTeamWorkspace";
import { CommandPalette } from "@/src/features/command-palette/CommandPalette";
import { TransactionComposer } from "@/src/features/transactions/TransactionComposer";
import { NotificationBell } from "@/src/features/notifications/NotificationBell";
import { useUIStore, useWorkspaceStore } from "@/src/stores/ui-store";
import type { WorkspaceWithRole } from "@/src/core/sync/types";
import { can } from "@/src/core/permissions/can";
import { cn } from "@/src/lib/cn";

export type ShellUser = {
  displayName: string;
  email: string;
};

type Props = {
  user: ShellUser;
  workspaces: WorkspaceWithRole[];
  children: ReactNode;
};

function navClass(active: boolean) {
  return cn(
    "block border border-transparent px-3 py-2 text-sm",
    active
      ? "bg-ink text-canvas"
      : "text-muted hover:bg-ink hover:text-canvas",
  );
}

export function AppShell({ user, workspaces, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);

  const personal = workspaces.find((w) => w.kind === "personal");
  const teams = workspaces.filter((w) => w.kind === "team");

  const activeWorkspaceId = pathname.startsWith("/w/")
    ? pathname.split("/")[2] ?? null
    : personal?.id ?? null;

  const isPersonalRoute =
    !pathname.startsWith("/w/") &&
    !pathname.startsWith("/settings") &&
    pathname !== "/login";

  useEffect(() => {
    if (activeWorkspaceId) {
      setActiveWorkspaceId(activeWorkspaceId);
    }
  }, [activeWorkspaceId, setActiveWorkspaceId]);

  return (
    <div className="flex min-h-full">
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-dashed border-hairline bg-canvas transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="border-b border-dashed border-hairline px-5 py-5">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-light.png"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 border border-dashed border-hairline dark:hidden"
              priority
            />
            <Image
              src="/logo-dark.png"
              alt=""
              width={40}
              height={40}
              className="hidden h-10 w-10 border border-dashed border-hairline dark:block"
              priority
            />
            <p className="font-display text-lg font-bold tracking-[-0.04em] uppercase">
              Noirly Ledger
            </p>
          </div>
          <button
            type="button"
            onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
            className="mt-3 flex w-full items-center justify-between border border-dashed border-hairline bg-surface px-3 py-2 text-left text-sm text-muted hover:bg-ink hover:text-canvas"
          >
            <span>Search</span>
            <span className="font-mono text-[10px]">⌘K</span>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
          <section>
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#737373]">
              Workspace
            </p>
            <ul className="flex flex-col gap-1">
              {personal ? (
                <li>
                  <Link
                    href="/home"
                    onClick={() => setOpen(false)}
                    className={navClass(isPersonalRoute || pathname === "/home")}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate">{personal.name}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wide text-[#737373]">
                        personal
                      </span>
                    </span>
                  </Link>
                </li>
              ) : null}
              {teams.map((workspace) => {
                const href = `/w/${workspace.id}`;
                const active = activeWorkspaceId === workspace.id && pathname.startsWith("/w/");
                return (
                  <li key={workspace.id}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={navClass(active)}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate">{workspace.name}</span>
                        <span className="font-mono text-[10px] uppercase tracking-wide text-[#737373]">
                          team
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <CreateTeamWorkspace />
          </section>

          <section>
            <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#737373]">
              Navigate
            </p>
            <ul className="flex flex-col gap-1">
              {pathname.startsWith("/w/") && activeWorkspaceId ? (
                <TeamNav
                  workspaceId={activeWorkspaceId}
                  role={
                    teams.find((w) => w.id === activeWorkspaceId)?.role ?? "member"
                  }
                  pathname={pathname}
                  onNavigate={() => setOpen(false)}
                />
              ) : (
                <>
                  <li>
                    <Link href="/home" onClick={() => setOpen(false)} className={navClass(pathname === "/home")}>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/transactions"
                      onClick={() => setOpen(false)}
                      className={navClass(pathname.startsWith("/transactions"))}
                    >
                      Transactions
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/budgets"
                      onClick={() => setOpen(false)}
                      className={navClass(pathname.startsWith("/budgets"))}
                    >
                      Budgets
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/categories"
                      onClick={() => setOpen(false)}
                      className={navClass(pathname.startsWith("/categories"))}
                    >
                      Categories
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/goals"
                      onClick={() => setOpen(false)}
                      className={navClass(pathname.startsWith("/goals"))}
                    >
                      Goals
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/recurring"
                      onClick={() => setOpen(false)}
                      className={navClass(pathname.startsWith("/recurring"))}
                    >
                      Recurring
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/reports"
                      onClick={() => setOpen(false)}
                      className={navClass(pathname.startsWith("/reports"))}
                    >
                      Reports
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  className={navClass(pathname.startsWith("/settings"))}
                >
                  Settings
                </Link>
              </li>
            </ul>
          </section>
        </nav>

        <div className="border-t border-dashed border-hairline px-4 py-4">
          <div className="mb-3 hidden md:block">
            <NotificationBell />
          </div>
          <p className="truncate text-sm text-ink">{user.displayName}</p>
          <p className="truncate font-mono text-[11px] text-muted">{user.email}</p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-dashed border-hairline px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="border border-dashed border-hairline px-3 py-1.5 text-sm text-ink"
          >
            Menu
          </button>
          <Image
            src="/logo-light.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 dark:hidden"
          />
          <Image
            src="/logo-dark.png"
            alt=""
            width={28}
            height={28}
            className="hidden h-7 w-7 dark:block"
          />
          <p className="font-display text-sm font-bold tracking-[-0.04em] uppercase">
            Ledger
          </p>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
      <CommandPalette workspaces={workspaces} />
      {personal ? (
        <TransactionComposer
          workspaceId={personal.id}
          baseCurrency={personal.baseCurrency}
        />
      ) : null}
    </div>
  );
}

function TeamNav({
  workspaceId,
  role,
  pathname,
  onNavigate,
}: {
  workspaceId: string;
  role: WorkspaceWithRole["role"];
  pathname: string;
  onNavigate: () => void;
}) {
  const items = [
    { href: `/w/${workspaceId}`, label: "Dashboard", match: "exact" as const },
    { href: `/w/${workspaceId}/pools`, label: "Budget pools", match: "/pools" },
    { href: `/w/${workspaceId}/expenses`, label: "Expenses", match: "/expenses" },
    ...(can(role, "expense.decide")
      ? [
          {
            href: `/w/${workspaceId}/approvals`,
            label: "Approvals",
            match: "/approvals",
          },
        ]
      : []),
    { href: `/w/${workspaceId}/members`, label: "Members", match: "/members" },
    { href: `/w/${workspaceId}/reports`, label: "Reports", match: "/reports" },
  ];

  return (
    <>
      {items.map((item) => {
        const active =
          item.match === "exact"
            ? pathname === item.href
            : pathname.includes(item.match);
        return (
          <li key={item.href}>
            <Link href={item.href} onClick={onNavigate} className={navClass(active)}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </>
  );
}
