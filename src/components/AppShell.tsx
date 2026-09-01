"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import {
  BarChart3,
  FolderKanban,
  Goal,
  LayoutDashboard,
  Receipt,
  Repeat,
  Search,
  Settings,
  Tags,
  Users,
  Wallet,
} from "lucide-react";
import {
  AppShell as UIShell,
  cn,
  type AppNavItem,
} from "@noirly-dev/ui";
import { SignOutButton } from "@/src/features/auth/SignOutButton";
import { CreateTeamWorkspace } from "@/src/features/workspace/CreateTeamWorkspace";
import { CommandPalette } from "@/src/features/command-palette/CommandPalette";
import { TransactionComposer } from "@/src/features/transactions/TransactionComposer";
import { NotificationBell } from "@/src/features/notifications/NotificationBell";
import { useUIStore, useWorkspaceStore } from "@/src/stores/ui-store";
import type { WorkspaceWithRole } from "@/src/core/sync/types";
import { can } from "@/src/core/permissions/can";

export type ShellUser = {
  displayName: string;
  email: string;
};

type Props = {
  user: ShellUser;
  workspaces: WorkspaceWithRole[];
  children: ReactNode;
};

function SidebarBrand() {
  return (
    <div className="flex items-center gap-3.5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] p-1">
        <Image
          src="/logo-dark.png"
          alt=""
          width={40}
          height={40}
          className="h-9 w-9"
          priority
        />
      </div>
      <div>
        <p className="font-display text-sm font-semibold">Noirly Ledger</p>
        <p className="text-xs text-[var(--muted-foreground)]">Finance</p>
      </div>
    </div>
  );
}

function workspaceLinkClass(active: boolean) {
  return cn(
    "flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
    active
      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
      : "text-[var(--muted-foreground)] hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
  );
}

export function AppShell({ user, workspaces, children }: Props) {
  const pathname = usePathname();
  const setActiveWorkspaceId = useWorkspaceStore((s) => s.setActiveWorkspaceId);

  const personal = workspaces.find((w) => w.kind === "personal");
  const teams = workspaces.filter((w) => w.kind === "team");

  const activeWorkspaceId = pathname.startsWith("/w/")
    ? (pathname.split("/")[2] ?? null)
    : (personal?.id ?? null);

  const isPersonalRoute =
    !pathname.startsWith("/w/") &&
    !pathname.startsWith("/settings") &&
    pathname !== "/login";

  const teamRole =
    teams.find((w) => w.id === activeWorkspaceId)?.role ?? "member";

  useEffect(() => {
    if (activeWorkspaceId) {
      setActiveWorkspaceId(activeWorkspaceId);
    }
  }, [activeWorkspaceId, setActiveWorkspaceId]);

  const navItems: AppNavItem[] = useMemo(() => {
    if (pathname.startsWith("/w/") && activeWorkspaceId) {
      const items: AppNavItem[] = [
        {
          href: `/w/${activeWorkspaceId}`,
          label: "Dashboard",
          icon: LayoutDashboard,
          match: "exact",
        },
        {
          href: `/w/${activeWorkspaceId}/pools`,
          label: "Budget pools",
          icon: FolderKanban,
          match: "prefix",
        },
        {
          href: `/w/${activeWorkspaceId}/expenses`,
          label: "Expenses",
          icon: Receipt,
          match: "prefix",
        },
      ];
      if (can(teamRole, "expense.decide")) {
        items.push({
          href: `/w/${activeWorkspaceId}/approvals`,
          label: "Approvals",
          icon: Wallet,
          match: "prefix",
        });
      }
      items.push(
        {
          href: `/w/${activeWorkspaceId}/members`,
          label: "Members",
          icon: Users,
          match: "prefix",
        },
        {
          href: `/w/${activeWorkspaceId}/reports`,
          label: "Reports",
          icon: BarChart3,
          match: "prefix",
        },
      );
      return items;
    }

    return [
      { href: "/home", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
      { href: "/transactions", label: "Transactions", icon: Receipt, match: "prefix" },
      { href: "/budgets", label: "Budgets", icon: Wallet, match: "prefix" },
      { href: "/categories", label: "Categories", icon: Tags, match: "prefix" },
      { href: "/goals", label: "Goals", icon: Goal, match: "prefix" },
      { href: "/recurring", label: "Recurring", icon: Repeat, match: "prefix" },
      { href: "/reports", label: "Reports", icon: BarChart3, match: "prefix" },
    ];
  }, [activeWorkspaceId, pathname, teamRole]);

  const settingsItem: AppNavItem = {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    match: "prefix",
  };

  const items = [...navItems, settingsItem];

  return (
    <>
      <UIShell
        sidebar={{
          brand: (
            <div className="space-y-4">
              <SidebarBrand />
              <button
                type="button"
                onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--hairline)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              >
                <span className="flex items-center gap-2">
                  <Search size={14} />
                  Search
                </span>
                <span className="font-mono text-[10px]">⌘K</span>
              </button>
              <div>
                <p className="px-1 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  Workspace
                </p>
                <ul className="flex flex-col gap-0.5">
                  {personal ? (
                    <li>
                      <Link
                        href="/home"
                        className={workspaceLinkClass(
                          isPersonalRoute || pathname === "/home",
                        )}
                      >
                        <span className="truncate">{personal.name}</span>
                        <span className="font-mono text-[10px] uppercase tracking-wide opacity-60">
                          personal
                        </span>
                      </Link>
                    </li>
                  ) : null}
                  {teams.map((workspace) => {
                    const href = `/w/${workspace.id}`;
                    const active =
                      activeWorkspaceId === workspace.id &&
                      pathname.startsWith("/w/");
                    return (
                      <li key={workspace.id}>
                        <Link href={href} className={workspaceLinkClass(active)}>
                          <span className="truncate">{workspace.name}</span>
                          <span className="font-mono text-[10px] uppercase tracking-wide opacity-60">
                            team
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <CreateTeamWorkspace />
              </div>
            </div>
          ),
          items,
          footer: (
            <div className="space-y-3 border-t border-[var(--hairline)] pt-4">
              <div className="hidden md:block">
                <NotificationBell />
              </div>
              <div>
                <p className="truncate text-sm">{user.displayName}</p>
                <p className="truncate font-mono text-[11px] text-[var(--muted-foreground)]">
                  {user.email}
                </p>
              </div>
              <SignOutButton />
            </div>
          ),
        }}
        header={{
          brand: (
            <p className="font-display text-sm font-semibold tracking-tight">
              Ledger
            </p>
          ),
          actions: (
            <>
              <button
                type="button"
                onClick={() => useUIStore.getState().setCommandPaletteOpen(true)}
                className="rounded-lg border border-[var(--hairline)] px-3 py-1.5 font-mono text-sm text-[var(--muted-foreground)]"
              >
                ⌘K
              </button>
              <NotificationBell />
            </>
          ),
        }}
      >
        {children}
      </UIShell>
      <CommandPalette workspaces={workspaces} />
      {personal ? (
        <TransactionComposer
          workspaceId={personal.id}
          baseCurrency={personal.baseCurrency}
        />
      ) : null}
    </>
  );
}
