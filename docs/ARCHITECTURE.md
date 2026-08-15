# Noirly Ledger — Web Architecture

**Product:** Noirly Ledger (web)  
**Audience:** Principal frontend / full-stack implementation  
**Status:** Architecture decision record for MVP → v2  
**Stack:** Next.js App Router · TypeScript strict · Tailwind · pnpm · React Query · Zustand · MongoDB / Mongoose · `@noirly-dev/realtime-client` · Framer Motion · Recharts · RHF + Zod  

---

## Locked decisions

| Decision | Choice | Justification |
| --- | --- | --- |
| **Auth** | **Auth.js (NextAuth v5) + Noirly Identity OIDC** | Same SSO story as Flow; email/password + Google live on Identity, not in Ledger |
| **Primary data store** | **MongoDB + Mongoose**, DB `noirly-ledger` | Operational parity with Identity/Flow; money as **integer minor units** |
| **App API** | **Next.js Route Handlers** (`app/api/**`) | Single deployable for MVP; domain in `src/core` |
| **Realtime** | **noirly-realtime** via `@noirly-dev/realtime-client` | Self-hosted WS; no Supabase Realtime / Pusher / Ably |
| **Repo shape** | **Standalone `noirly-ledger`** (monorepo-ready) | Mirror Flow; extract `src/core` → `@noirly/ledger-core` later |
| **Workspaces** | **Ledger-owned** | Independent of Flow workspaces for MVP |
| **Multi-currency** | **Slim (4B)** | Base currency + per-txn currency + **user-set FX rates**; no live FX vendor |
| **Charts** | **Recharts** | Fast path for donut/line/bar + table fallback; Visx later if needed |
| **PDF export** | **Server Route Handler + `@react-pdf/renderer`** | Deterministic reports; CSV via streaming Route Handlers |
| **Client server-state** | **TanStack Query v5** | Cache + optimistic mutations |
| **Client UI state** | **Zustand** | Switcher, palette, drawers — never mirror ledgers |
| **Forms** | **React Hook Form + Zod** | Amount/currency/receipt validation |
| **Package manager** | **pnpm** | Required |

---

## 1. Executive summary & goals

### 1.1 Purpose

Noirly Ledger is a **dark-mode, production-grade budgeting and finance tracking web app** for:

- **Individuals** — personal expenses, category budgets, recurring items, savings goals, multi-currency display
- **Teams / businesses** — shared budget pools, expense submission with receipts, approval workflows, RBAC, live remaining-balance sync

One product surface; mode is determined by **workspace context** (personal vs team), not separate apps.

### 1.2 Goals

| Goal | Measure |
| --- | --- |
| Single Noirly account | Auth via **Noirly Identity** (OIDC); no second password store |
| Numerically trustworthy UX | All money as integer minor units; JetBrains Mono tabular figures |
| Fast local UX | Optimistic create/approve; Cmd+K entry; keyboard-first |
| Team-safe collaboration | Workspace RBAC + noirly-realtime on budget pools |
| Swappable backend | `LedgerSyncProvider` interface; Mongo adapter is MVP primary |
| Monorepo-ready | Domain in `src/core` / future `@noirly/ledger-core` |
| Accessible | WCAG AA, focus traps, chart text alternatives |

### 1.3 Non-goals (MVP)

- Native mobile / Expo
- Live FX market rates / banking aggregators (Plaid, etc.)
- Full double-entry accounting / GL
- Shared workspaces with Flow
- Light theme
- Offline-first CRDT sync

### 1.4 Product principles

1. **Money never floats in JS UI math** — store/display via minor units + currency code; convert only through explicit rate tables.
2. **React Query is cache truth; Mongo is system truth; realtime patches the cache.**
3. **Personal and team share the same Transaction shape** — scope via `workspaceId` + optional `budgetPoolId` / approval state.
4. **Approvals are first-class** — submitted expenses do not hit pool spend until approved (configurable later; MVP = spend counts on **approve**).

---

## 2. Project structure

### 2.1 Near-term repo layout (`noirly-ledger`)

Treat the repo as the **web app**. Structure so a future Turborepo can lift `src/core` → `packages/ledger-core` and this app → `apps/web` with minimal churn.

```text
noirly-ledger/
├── app/                                    # Next.js App Router (UI + route handlers)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (personal)/                         # personal-scoped UX (active personal workspace)
│   │   ├── layout.tsx                      # shell; asserts personal workspace
│   │   ├── page.tsx                        # personal dashboard
│   │   ├── transactions/
│   │   │   ├── page.tsx
│   │   │   └── [transactionId]/page.tsx
│   │   ├── budgets/page.tsx
│   │   ├── categories/page.tsx
│   │   ├── goals/page.tsx
│   │   ├── recurring/page.tsx
│   │   ├── reports/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── currency/page.tsx           # base currency + FX rates
│   │       └── notifications/page.tsx
│   ├── (workspace)/
│   │   └── w/[workspaceId]/
│   │       ├── layout.tsx                  # membership guard + role context
│   │       ├── page.tsx                    # team dashboard
│   │       ├── pools/
│   │       │   ├── page.tsx
│   │       │   └── [poolId]/page.tsx      # pool detail + presence + live balance
│   │       ├── expenses/
│   │       │   ├── page.tsx                # submissions list
│   │       │   ├── new/page.tsx
│   │       │   └── [expenseId]/page.tsx
│   │       ├── approvals/page.tsx          # approver inbox
│   │       ├── reports/page.tsx
│   │       ├── members/page.tsx
│   │       └── settings/page.tsx
│   ├── (app)/                              # cross-cutting authenticated chrome routes
│   │   ├── layout.tsx                      # AppShell: switcher, nav, cmd-k, toasts
│   │   ├── page.tsx                        # redirect → last workspace or personal
│   │   └── settings/
│   │       ├── profile/page.tsx
│   │       └── preferences/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── health/route.ts
│   │   ├── workspaces/
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── budgets/
│   │   ├── budget-pools/
│   │   ├── approvals/
│   │   ├── savings-goals/
│   │   ├── fx-rates/
│   │   ├── uploads/                        # receipt upload (presign or proxy)
│   │   ├── exports/                        # CSV / PDF
│   │   ├── notifications/
│   │   ├── search/
│   │   └── realtime/token/route.ts
│   ├── layout.tsx
│   ├── globals.css
│   └── not-found.tsx
├── src/
│   ├── core/                               # backend-agnostic domain (future package)
│   │   ├── models/                         # TS types + Zod schemas
│   │   ├── money/                          # minor units, format, convert
│   │   ├── permissions/                    # RBAC pure functions
│   │   ├── budgets/                        # period windows, progress calc
│   │   ├── recurrence/                     # next occurrence helpers
│   │   └── sync/
│   │       ├── types.ts                    # LedgerSyncProvider contract
│   │       └── query-keys.ts
│   ├── server/                             # Next-only adapters
│   │   ├── db/
│   │   ├── models/                         # Mongoose schemas (Ledger DB only)
│   │   ├── auth/
│   │   ├── providers/
│   │   │   └── mongo-ledger-provider.ts
│   │   ├── realtime/                       # publisher wrappers
│   │   ├── exports/                        # CSV builders, PDF templates
│   │   └── storage/                        # receipt object storage adapter
│   ├── features/
│   │   ├── auth/
│   │   ├── workspace/
│   │   ├── dashboard/
│   │   ├── transactions/
│   │   ├── categories/
│   │   ├── budgets/
│   │   ├── budget-pools/
│   │   ├── approvals/
│   │   ├── savings-goals/
│   │   ├── recurring/
│   │   ├── reports/
│   │   ├── command-palette/
│   │   ├── notifications/
│   │   ├── currency/
│   │   └── realtime/
│   ├── components/                         # composed, reusable
│   ├── ui/                                 # design-system primitives
│   ├── stores/                             # Zustand
│   ├── hooks/
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── query-client.ts
│   │   └── cn.ts
│   └── styles/
│       └── tokens.css
├── docs/
│   └── ARCHITECTURE.md                     # this file
├── public/
├── tests/
├── proxy.ts                                # Next auth gate (middleware rename)
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

### 2.2 Future Turborepo target

```text
noirly/
├── apps/
│   ├── identity/
│   ├── flow-web/
│   ├── ledger-web/          # this app
│   └── ledger-mobile/       # future
├── packages/
│   ├── ledger-core/         # lifted from src/core
│   ├── ui/                  # optional shared Noirly primitives
│   └── config-eslint/
└── pnpm-workspace.yaml
```

### 2.3 Layering rules

1. **`src/ui`** — no data fetching, no domain Zustand  
2. **`src/features/*`** — compose UI + React Query hooks  
3. **`src/core`** — pure TS: schemas, money math, permissions, provider types  
4. **`src/server`** — Mongoose, Auth.js, realtime publisher, storage, exports  
5. Features never import Mongoose models directly  

### 2.4 Route group note

`(personal)` routes resolve the user’s **personal** workspace server-side and keep URLs short (`/transactions`). `(workspace)/w/[workspaceId]` is for **team** workspaces. Both nest under the authenticated `(app)` shell via shared layout composition (personal/workspace layouts import `AppShell` or share a parent authenticated layout).

---

## 3. Data models

IDs are **UUIDs** (`uuid` / `cuid2`). Timestamps are ISO UTC strings. Soft-delete via `deletedAt` where recovery matters (transactions, categories).

### 3.1 Money conventions

```ts
/** Integer minor units of `currency` (e.g. USD cents). Never use number floats for persisted money. */
export type MoneyMinor = number;

export interface Money {
  amountMinor: MoneyMinor;
  currency: string; // ISO 4217, uppercase
}
```

- Display via `formatMoney(money, locale)` using `Intl.NumberFormat` + JetBrains Mono.  
- Conversion: `convert(amountMinor, from, to, rates)` using user FX table; rates are `toBasePerUnit` against workspace/user **base currency**.  
- Rounding: banker’s or half-up — pick **half-up to nearest minor unit** for MVP; document in `src/core/money`.

### 3.2 TypeScript interfaces (domain)

```ts
// src/core/models/types.ts

export type WorkspaceKind = "personal" | "team";
export type MemberRole = "owner" | "approver" | "member";
export type BudgetPeriod = "weekly" | "monthly" | "custom";
export type TransactionType = "expense" | "income" | "transfer";
export type ApprovalStatus = "draft" | "submitted" | "approved" | "rejected" | "cancelled";
export type NotificationKind =
  | "budget.threshold"
  | "approval.requested"
  | "approval.decided"
  | "goal.reached"
  | "recurring.due";

export interface User {
  id: string;
  identitySub: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl: string | null;
  /** Personal defaults */
  baseCurrency: string;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  kind: WorkspaceKind;
  name: string;
  slug: string;
  ownerUserId: string;
  baseCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  /** null = personal workspace scope via workspaceId only; always set workspaceId */
  workspaceId: string;
  name: string;
  icon: string;              // lucide icon key or emoji shortcode
  color: string;             // hex
  isSystem: boolean;         // default seed categories
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface FxRate {
  id: string;
  workspaceId: string;
  currency: string;          // quote currency
  /** How many base-currency minor units per 1.00 unit of `currency` (scaled — see money module) */
  rateToBase: number;        // use fixed-point: store as integer * 1e8 in Mongo
  effectiveFrom: string;     // ISO date
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  byMonthDay?: number;
  until?: string | null;
}

export interface Transaction {
  id: string;
  workspaceId: string;
  type: TransactionType;
  amountMinor: MoneyMinor;
  currency: string;
  /** Snapshot of converted amount in workspace base at entry time (optional but recommended) */
  baseAmountMinor: MoneyMinor;
  categoryId: string | null;
  budgetPoolId: string | null;     // team expenses assigned to a pool
  date: string;                    // ISO date (calendar day in workspace TZ later; UTC date MVP)
  note: string | null;
  receiptUrl: string | null;
  receiptStorageKey: string | null;
  isRecurring: boolean;
  recurrence: RecurrenceRule | null;
  recurringParentId: string | null;
  createdById: string;
  /** Personal txns: null. Team submitted expenses: ApprovalRequest id */
  approvalRequestId: string | null;
  /** When true, counts toward budgets/pools (approved or personal immediate) */
  isPosted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Budget {
  id: string;
  workspaceId: string;
  categoryId: string;
  period: BudgetPeriod;
  /** Custom window when period === "custom" */
  periodStart: string | null;
  periodEnd: string | null;
  limitAmountMinor: MoneyMinor;
  currency: string;                // usually workspace base
  alertThresholdPct: number;       // e.g. 80
  createdAt: string;
  updatedAt: string;
}

export interface BudgetPool {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  limitAmountMinor: MoneyMinor;
  currency: string;
  /** Denormalized posted spend; server is authoritative, clients patch via realtime */
  currentSpendMinor: MoneyMinor;
  periodStart: string | null;
  periodEnd: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  workspaceId: string;             // personal workspace only
  name: string;
  targetAmountMinor: MoneyMinor;
  currentAmountMinor: MoneyMinor;
  currency: string;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface ApprovalRequest {
  id: string;
  workspaceId: string;
  transactionId: string;
  budgetPoolId: string;
  submittedById: string;
  status: ApprovalStatus;
  reviewedById: string | null;
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  workspaceId: string | null;
  kind: NotificationKind;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  emailRequested: boolean;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  workspaceId: string;
  actorId: string;
  verb:
    | "transaction.created"
    | "transaction.updated"
    | "expense.submitted"
    | "expense.approved"
    | "expense.rejected"
    | "budget.updated"
    | "budget_pool.updated"
    | "member.added";
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}
```

### 3.3 Mongoose sketch (MongoDB collections)

Same MongoDB **host/cluster** as Identity/Flow; database name **`noirly-ledger`** (never write into `noirly-identity` or `noirly-flow`).

```ts
// users — Ledger profile projection of Identity subject
{ identitySub, email, emailVerified, displayName, avatarUrl?, baseCurrency, locale, createdAt, updatedAt }

// workspaces
{ kind: "personal"|"team", name, slug, ownerUserId, baseCurrency, createdAt, updatedAt }

// workspace_members
{ workspaceId, userId, role: "owner"|"approver"|"member", createdAt, updatedAt }
// unique(workspaceId, userId)

// categories
{ workspaceId, name, icon, color, isSystem, archivedAt?, deletedAt?, createdAt, updatedAt }

// fx_rates
{ workspaceId, currency, rateToBase: Long/Decimal128-as-int, effectiveFrom, createdById, createdAt, updatedAt }
// index(workspaceId, currency, effectiveFrom desc)

// transactions
{
  workspaceId, type, amountMinor, currency, baseAmountMinor,
  categoryId?, budgetPoolId?, date, note?, receiptUrl?, receiptStorageKey?,
  isRecurring, recurrence?, recurringParentId?,
  createdById, approvalRequestId?, isPosted,
  deletedAt?, createdAt, updatedAt
}
// indexes: (workspaceId, date), (workspaceId, categoryId, date), (budgetPoolId, isPosted)

// budgets
{ workspaceId, categoryId, period, periodStart?, periodEnd?, limitAmountMinor, currency, alertThresholdPct, createdAt, updatedAt }
// unique-ish: (workspaceId, categoryId, period, periodStart)

// budget_pools
{ workspaceId, name, description?, limitAmountMinor, currency, currentSpendMinor, periodStart?, periodEnd?, archivedAt?, createdAt, updatedAt }

// savings_goals
{ workspaceId, name, targetAmountMinor, currentAmountMinor, currency, targetDate?, completedAt?, createdAt, updatedAt }

// approval_requests
{ workspaceId, transactionId, budgetPoolId, submittedById, status, reviewedById?, reviewNote?, submittedAt?, reviewedAt?, createdAt, updatedAt }

// notifications, activity_events — separate collections
```

### 3.4 Personal vs team semantics

| Concern | Personal workspace | Team workspace |
| --- | --- | --- |
| Bootstrap | Created on first login; cannot delete | Explicit create + invites |
| Roles | Single member, always `owner` | `owner` / `approver` / `member` |
| Transactions | Posted immediately | Pool-bound expenses go through approval |
| Budget pools | N/A (use category budgets) | Primary shared spend control |
| Savings goals | Allowed | Not in MVP (personal only) |

### 3.5 Default categories (seed)

Food & Drink, Transport, Housing, Utilities, Health, Entertainment, Shopping, Travel, Income, Transfer, Other — each with icon + color; `isSystem: true`; user may archive but not hard-delete system rows in MVP.

---

## 4. API / data layer design

### 4.1 Backend choice (justification)

| Option | Verdict |
| --- | --- |
| Supabase Postgres + Auth | Rejected — dual auth vs Identity; operational split from Flow |
| Custom GraphQL | Deferred — REST Route Handlers enough for MVP surface |
| **MongoDB + Mongoose + Route Handlers** | **Chosen** — ecosystem parity; integer money; swappable via provider |

### 4.2 `LedgerSyncProvider` (backend-agnostic)

```ts
// src/core/sync/types.ts

export interface LedgerSyncProvider {
  // Workspaces
  listWorkspaces(): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace & { role: MemberRole }>;
  createWorkspace(input: { name: string; kind: "team"; baseCurrency: string }): Promise<Workspace>;
  listMembers(workspaceId: string): Promise<Array<WorkspaceMember & { user: Pick<User, "id" | "displayName" | "avatarUrl" | "email"> }>>;
  updateMemberRole(workspaceId: string, userId: string, role: MemberRole): Promise<WorkspaceMember>;

  // Categories
  listCategories(workspaceId: string): Promise<Category[]>;
  createCategory(input: Omit<Category, "id" | "createdAt" | "updatedAt" | "deletedAt" | "archivedAt" | "isSystem">): Promise<Category>;
  updateCategory(id: string, patch: Partial<Category>): Promise<Category>;

  // Transactions
  listTransactions(query: ListTransactionsQuery): Promise<{ items: Transaction[]; nextCursor?: string }>;
  getTransaction(id: string): Promise<Transaction>;
  createTransaction(input: CreateTransactionInput): Promise<Transaction>;
  updateTransaction(id: string, patch: UpdateTransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;

  // Budgets / pools / goals
  listBudgets(workspaceId: string): Promise<Budget[]>;
  upsertBudget(input: UpsertBudgetInput): Promise<Budget>;
  listBudgetPools(workspaceId: string): Promise<BudgetPool[]>;
  getBudgetPool(id: string): Promise<BudgetPool>;
  createBudgetPool(input: CreateBudgetPoolInput): Promise<BudgetPool>;
  listSavingsGoals(workspaceId: string): Promise<SavingsGoal[]>;
  upsertSavingsGoal(input: UpsertSavingsGoalInput): Promise<SavingsGoal>;

  // Approvals
  listApprovals(query: { workspaceId: string; status?: ApprovalStatus[] }): Promise<ApprovalRequest[]>;
  submitExpense(input: SubmitExpenseInput): Promise<{ transaction: Transaction; approval: ApprovalRequest }>;
  decideApproval(input: {
    approvalId: string;
    decision: "approved" | "rejected";
    reviewNote?: string;
  }): Promise<{ approval: ApprovalRequest; transaction: Transaction; pool: BudgetPool }>;

  // FX
  listFxRates(workspaceId: string): Promise<FxRate[]>;
  upsertFxRate(input: UpsertFxRateInput): Promise<FxRate>;

  // Analytics (aggregated server-side for dashboards)
  getDashboardSummary(workspaceId: string, range: DateRange): Promise<DashboardSummary>;

  // Exports
  exportReport(input: ExportReportInput): Promise<{ downloadUrl: string } | { csv: string }>;
}
```

**MVP implementation:** `MongoLedgerProvider` in `src/server/providers/mongo-ledger-provider.ts`.  
**Client:** `api-client` → REST → provider. Never imports Mongoose.

### 4.3 REST shape

All under `/api`, JSON, Zod-validated. Auth via Auth.js session cookie.

| Method | Path | Notes |
| --- | --- | --- |
| `GET/POST` | `/api/workspaces` | List / create team |
| `GET` | `/api/workspaces/:id` | + role |
| `GET/PATCH` | `/api/workspaces/:id/members` | RBAC |
| `GET/POST` | `/api/workspaces/:id/categories` | |
| `GET/POST` | `/api/workspaces/:id/transactions` | cursor pagination |
| `GET/PATCH/DELETE` | `/api/transactions/:id` | |
| `GET/POST` | `/api/workspaces/:id/budgets` | |
| `GET/POST` | `/api/workspaces/:id/budget-pools` | |
| `GET` | `/api/budget-pools/:id` | |
| `POST` | `/api/workspaces/:id/expenses` | submit for approval |
| `GET` | `/api/workspaces/:id/approvals` | |
| `POST` | `/api/approvals/:id/decide` | approve/reject |
| `GET/POST` | `/api/workspaces/:id/savings-goals` | personal only |
| `GET/PUT` | `/api/workspaces/:id/fx-rates` | user-set rates |
| `GET` | `/api/workspaces/:id/dashboard` | aggregates |
| `POST` | `/api/workspaces/:id/exports` | `{ format: "csv"\|"pdf", ... }` |
| `POST` | `/api/uploads/receipts` | returns upload URL + key |
| `GET` | `/api/notifications` | |
| `GET` | `/api/realtime/token` | capability-scoped JWT |
| `GET` | `/api/search?q=` | workspace-scoped |

Error envelope (Identity/Flow-aligned):

```json
{ "error": "forbidden", "message": "Insufficient permissions" }
```

### 4.4 Auth strategy (summary)

- **AuthN:** Auth.js + Noirly Identity OIDC (`openid profile email offline_access`)  
- **Google:** via Identity “Continue with Google”, not a Ledger Google provider  
- **AuthZ:** Ledger `WorkspaceMember.role` checks in API + layout guards  
- **Client registration:** confidential client `noirly-ledger` in Identity; redirect `{LEDGER_URL}/api/auth/callback/noirly`

### 4.5 Receipt storage

Abstract `ReceiptStorage` (`put`, `getSignedUrl`, `delete`). MVP: local/S3-compatible (MinIO or R2). Route Handler validates MIME (`image/jpeg|png|webp|pdf`), max **8 MB**, returns `receiptUrl` for preview.

---

## 5. State management architecture

### 5.1 Zustand (UI-only)

```ts
// src/stores/workspace-store.ts
interface WorkspaceUIState {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string) => void;
}

// src/stores/ui-store.ts
interface UIState {
  commandPaletteOpen: boolean;
  transactionComposerOpen: boolean;
  transactionDrawerId: string | null;
  approvalsDrawerOpen: boolean;
}

// src/stores/dashboard-store.ts
interface DashboardUIState {
  rangePreset: "7d" | "30d" | "90d" | "mtd" | "custom";
  customRange: { from: string; to: string } | null;
  chartTableMode: Record<string, boolean>; // accessible table toggle per chart id
}
```

Persist: `activeWorkspaceId`, dashboard range preferences via `zustand/middleware` → `localStorage`.

**Do not** store transaction lists, pool balances, or approvals in Zustand.

### 5.2 React Query keys

```ts
// src/core/sync/query-keys.ts
export const qk = {
  workspaces: ["workspaces"] as const,
  workspace: (id: string) => ["workspaces", id] as const,
  members: (workspaceId: string) => ["members", workspaceId] as const,
  categories: (workspaceId: string) => ["categories", workspaceId] as const,
  transactions: (workspaceId: string, filters: TxFilters) =>
    ["transactions", workspaceId, filters] as const,
  transaction: (id: string) => ["transaction", id] as const,
  budgets: (workspaceId: string) => ["budgets", workspaceId] as const,
  budgetPools: (workspaceId: string) => ["budget-pools", workspaceId] as const,
  budgetPool: (poolId: string) => ["budget-pool", poolId] as const,
  approvals: (workspaceId: string, status?: string) =>
    ["approvals", workspaceId, status ?? "all"] as const,
  savingsGoals: (workspaceId: string) => ["savings-goals", workspaceId] as const,
  fxRates: (workspaceId: string) => ["fx-rates", workspaceId] as const,
  dashboard: (workspaceId: string, range: string) =>
    ["dashboard", workspaceId, range] as const,
  notifications: ["notifications"] as const,
};
```

### 5.3 Optimistic updates

| Mutation | Strategy |
| --- | --- |
| Create personal transaction | Insert optimistic row; set `isPosted: true`; patch category budget progress; rollback on error |
| Submit team expense | Optimistic `submitted` approval + txn (`isPosted: false`); wait for realtime/`decide` for spend |
| Approve expense | Optimistic: approval → approved, txn `isPosted: true`, pool `currentSpendMinor += baseAmountMinor`; reconcile on event |
| Reject expense | Optimistic status flip; no spend change |
| Update FX rate | Patch rates cache; invalidate dashboard aggregates |
| Savings goal contribution | Patch `currentAmountMinor`; motion on progress bar |

Use `onMutate` / `onError` / `onSettled`. On realtime authoritative events, **LWW by `updatedAt`** (same pattern as Flow `shouldApplyLww`).

---

## 6. Real-time integration design

Package: **`@noirly-dev/realtime-client`** (+ `/react` exports). Provider wraps the authenticated app shell.

### 6.1 Model

```text
Mutator → Route Handler → Mongo write → publisher.publish(channel, event, payload)
                                              ↓
Other clients ← WS ← useRealtimeEvent → patch/invalidate React Query
Presence ← usePresence on pool channel
```

- **System of record:** MongoDB `noirly-ledger`  
- **Collab fabric:** noirly-realtime  
- **UI cache:** React Query  

### 6.2 Channel map

| Channel | Subscribe when | Events |
| --- | --- | --- |
| `workspace:{workspaceId}` | Any authenticated page in workspace | `member.updated`, `budget.updated`, `category.upsert`, `notification.ping` |
| `workspace:{workspaceId}:budgetpool:{poolId}` | Pool detail / approvals affecting pool | `expense.submitted`, `expense.approved`, `expense.rejected`, `budget.updated` (pool spend), `pool.updated` |
| `workspace:{workspaceId}:approvals` | Approvals inbox (approver/owner) | `expense.submitted`, `expense.approved`, `expense.rejected` |
| `user:{userId}` | App shell | `notification.created` |

**Presence:** enable `presence: true` on `workspace:{id}:budgetpool:{poolId}` (and optionally approvals channel). Collapse by `userId`.

Token from `GET /api/realtime/token` must **capability-scope** only channels the user may join (membership + role checks).

### 6.3 Event payload types

```ts
export type LedgerRealtimeEvent =
  | {
      type: "expense.submitted";
      approval: ApprovalRequest;
      transaction: Transaction;
      poolId: string;
      version: number;
    }
  | {
      type: "expense.approved";
      approval: ApprovalRequest;
      transaction: Transaction;
      pool: BudgetPool; // includes authoritative currentSpendMinor
      version: number;
    }
  | {
      type: "expense.rejected";
      approval: ApprovalRequest;
      transaction: Transaction;
      poolId: string;
      version: number;
    }
  | {
      type: "budget.updated";
      pool: BudgetPool;
      version: number;
    }
  | {
      type: "pool.updated";
      pool: BudgetPool;
      version: number;
    }
  | {
      type: "transaction.upsert";
      transaction: Transaction;
      version: number;
    }
  | {
      type: "notification.created";
      notification: Notification;
    };
```

`version` = `Date.parse(updatedAt)` or monotonic integer on the entity.

### 6.4 Hook usage pattern

```tsx
// src/features/realtime/BudgetPoolRealtime.tsx
"use client";

import {
  useChannel,
  usePresence,
  useRealtimeEvent,
  useRealtimeStatus,
} from "@noirly-dev/realtime-client/react";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/src/core/sync/query-keys";
import { shouldApplyLww } from "@noirly-dev/realtime-shared";

export function BudgetPoolRealtime({
  workspaceId,
  poolId,
}: {
  workspaceId: string;
  poolId: string;
}) {
  const queryClient = useQueryClient();
  const status = useRealtimeStatus();
  const channel = `workspace:${workspaceId}:budgetpool:${poolId}`;

  useChannel(channel, { presence: true });
  const { members } = usePresence(channel, { collapseByUserId: true });

  useRealtimeEvent(channel, "expense.approved", (data) => {
    applyPool(data.pool, data.version);
    queryClient.setQueryData(qk.transaction(data.transaction.id), data.transaction);
    void queryClient.invalidateQueries({ queryKey: qk.approvals(workspaceId) });
    void queryClient.invalidateQueries({ queryKey: qk.dashboard(workspaceId, "active") });
  });

  useRealtimeEvent(channel, "expense.submitted", (data) => {
    void queryClient.invalidateQueries({ queryKey: qk.approvals(workspaceId) });
    queryClient.setQueryData(qk.transaction(data.transaction.id), data.transaction);
  });

  useRealtimeEvent(channel, "expense.rejected", (data) => {
    queryClient.setQueryData(qk.transaction(data.transaction.id), data.transaction);
    void queryClient.invalidateQueries({ queryKey: qk.approvals(workspaceId) });
  });

  useRealtimeEvent(channel, "budget.updated", (data) => {
    applyPool(data.pool, data.version);
  });

  return { members, status };

  function applyPool(pool: BudgetPool, version: number) {
    queryClient.setQueryData(qk.budgetPool(poolId), (old: BudgetPool | undefined) => {
      if (!old) return pool;
      if (!shouldApplyLww({ version }, { version: Date.parse(old.updatedAt) })) return old;
      return pool;
    });
    queryClient.setQueryData(qk.budgetPools(workspaceId), (old: BudgetPool[] | undefined) =>
      old?.map((p) => (p.id === pool.id ? pool : p)),
    );
  }
}
```

### 6.5 Optimistic → authoritative reconciliation

1. **Mutator tab:** optimistic cache update immediately.  
2. **Server response:** replace temp ids / confirm fields.  
3. **Realtime echo:** if `version` ≤ cache, **ignore**; if newer, **replace** entity (authoritative pool spend especially).  
4. **Never** increment spend client-side from a second event if `expense.approved` already carried full `pool`. Prefer event payloads that include the **full `BudgetPool` snapshot**.  
5. **Fallback:** if WS down, `refetchInterval: 5_000` on active pool + approvals queries.

### 6.6 Conflict rules

| Conflict | Resolution |
| --- | --- |
| Two approvers race | Server transactional: only first `submitted → approved/rejected` wins; second gets `409 conflict` |
| Pool spend | Server recomputes or atomic `$inc` on approve; clients accept server snapshot |
| Personal txn edit | LWW on `updatedAt` |
| FX rate same day | Last upsert wins for `effectiveFrom` day |

---

## 7. Routing structure

### 7.1 Route groups

| Group | Path prefix | Layout |
| --- | --- | --- |
| `(auth)` | `/login` | Minimal centered; no chrome |
| `(app)` | `/`, `/settings/*` | Authenticated shell entry / redirects |
| `(personal)` | `/transactions`, `/budgets`, `/goals`, … | Personal workspace context |
| `(workspace)` | `/w/[workspaceId]/…` | Team workspace guard + RBAC context |

### 7.2 Route table

| Route | Auth | Role | Description |
| --- | --- | --- | --- |
| `/login` | public | — | Continue with Noirly |
| `/api/auth/*` | Auth.js | — | OIDC |
| `/` | required | — | Redirect last workspace or `/` personal dashboard |
| `/transactions` | required | personal owner | Personal ledger |
| `/budgets` | required | personal | Category budgets |
| `/categories` | required | personal | Category manager |
| `/goals` | required | personal | Savings goals |
| `/recurring` | required | personal | Recurring rules |
| `/reports` | required | personal | Personal reports + export |
| `/settings/currency` | required | personal | Base currency + FX rates |
| `/w/[workspaceId]` | member | any | Team dashboard |
| `/w/[workspaceId]/pools` | member | any | Budget pools |
| `/w/[workspaceId]/pools/[poolId]` | member | any | Pool detail + presence |
| `/w/[workspaceId]/expenses` | member | any | Expense list |
| `/w/[workspaceId]/expenses/new` | member | member+ | Submit expense |
| `/w/[workspaceId]/approvals` | member | approver/owner | Approval inbox |
| `/w/[workspaceId]/members` | member | owner manage | Members |
| `/w/[workspaceId]/reports` | member | any | Team reports |
| `/w/[workspaceId]/settings` | member | owner | Workspace settings |

### 7.3 `proxy.ts` (auth gate)

```ts
// proxy.ts (conceptual)
export function proxy(req: NextRequest) {
  const session = /* Auth.js edge session */;
  if (isProtected(req) && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}
```

- Protect all non-`(auth)` / non-public API health routes.  
- **Do not** encode fine-grained RBAC in proxy — layouts + API `assertCan`.

### 7.4 Workspace layout guard

`app/(workspace)/w/[workspaceId]/layout.tsx`:

1. Resolve session → membership  
2. 404/403 if missing  
3. Provide `WorkspaceRoleProvider`  
4. Mount `WorkspaceRealtime` (workspace channel)  
5. Hide Approvals nav unless `approver` or `owner`

---

## 8. Component inventory

### 8.1 `src/ui` — primitives

| Component | Role |
| --- | --- |
| `Button` | primary cyan, ghost, danger/warning amber |
| `IconButton` | toolbars |
| `Input`, `Textarea`, `Select`, `Combobox`, `Checkbox`, `Switch` | forms |
| `MoneyInput` | major-unit entry → minor; mono preview |
| `Badge`, `StatusPill` | approval/budget states |
| `Avatar`, `AvatarGroup` | people / presence |
| `Dialog`, `Drawer`, `Popover`, `DropdownMenu` | overlays + focus trap |
| `Tooltip`, `Kbd` | shortcuts |
| `Progress` | budget bars (animatable width) |
| `Tabs`, `SegmentedControl` | views |
| `Skeleton`, `EmptyState` | loading/empty |
| `Separator` | `#2A2A2A` |
| `Toast` | feedback |
| `FileDropzone` | receipt upload |

Primitives consume CSS tokens only — no feature imports.

### 8.2 `src/components` — composed

| Component | Role |
| --- | --- |
| `AppShell` | sidebar + main + topbar |
| `WorkspaceSwitcher` | persistent top-level switcher |
| `TopBar` | search, Cmd+K, notifications, user menu |
| `SidebarNav` | personal vs team nav trees |
| `MoneyText` | JetBrains Mono amount + color semantic |
| `DateText` | mono dates |
| `ConfirmDialog` | destructive |
| `FilterBar` | date/category/pool filters |
| `PresenceAvatars` | realtime viewers |
| `PageHeader` | title + actions |
| `AccessibleChart` | chart + “View as table” toggle |

### 8.3 `src/features` — domain

| Feature | Key components |
| --- | --- |
| `auth` | `LoginScreen`, `ContinueWithNoirlyButton` |
| `workspace` | `CreateTeamWorkspaceDialog`, `MembersTable`, `RoleBadge` |
| `dashboard` | `NetBalanceHero`, `SpendByCategoryDonut`, `SpendOverTimeChart`, `BudgetHealthList` |
| `transactions` | `TransactionTable`, `TransactionRow`, `TransactionComposer`, `TransactionDrawer`, `ReceiptPreview` |
| `categories` | `CategoryManager`, `CategoryIconPicker` |
| `budgets` | `BudgetCard`, `BudgetProgressBar`, `BudgetEditor` |
| `budget-pools` | `PoolCard`, `PoolDetailHeader`, `PoolSpendMeter`, `PoolActivityFeed` |
| `approvals` | `ApprovalsInbox`, `ApprovalCard`, `ApproveRejectActions` |
| `savings-goals` | `GoalCard`, `GoalContributeDialog` |
| `recurring` | `RecurringList`, `RecurrenceEditor` |
| `reports` | `ReportBuilder`, `ExportMenu` |
| `command-palette` | `CommandPalette` (cmdk) |
| `notifications` | `NotificationBell`, `NotificationList` |
| `currency` | `BaseCurrencySelect`, `FxRateTable` |
| `realtime` | `BudgetPoolRealtime`, `WorkspaceRealtime`, `LedgerRealtimeProvider` |

### 8.4 Charts (Recharts)

| Chart | Component | A11y |
| --- | --- | --- |
| Category donut | `SpendByCategoryDonut` | Toggle data table; `aria-label` summary |
| Spend over time | `SpendOverTimeChart` (bar/line) | Table toggle; keyboard focusable legend |
| Net balance trend | `NetBalanceTrend` | Table toggle |
| Budget bars | Prefer custom `BudgetProgressBar` + Framer Motion, not Recharts |

### 8.5 Motion (Framer Motion — sparse)

- Balance / pool remaining number: subtle count or fade on change  
- Budget / goal bar width: `layout` / width spring  
- Chart enter: opacity + short translate  
- Drawer/modal: opacity + translateY  
Avoid ambient loops and glow noise.

---

## 9. Authentication & authorization

### 9.1 AuthN — Noirly Identity via Auth.js

```text
User → Ledger /login → Auth.js → Identity /authorize (PKCE)
     → callback → Auth.js session (HTTP-only cookie)
     → upsert local User by identitySub
     → ensure personal Workspace + seed categories
```

**Scopes:** `openid profile email offline_access`  
**Client id:** `noirly-ledger`  
**Redirect URI:** `{LEDGER_URL}/api/auth/callback/noirly`  

Session: **JWT** preferred for edge `proxy` reads; claims include `identitySub` + Ledger `userId`.

Passwords & Google: **only on Identity**.

### 9.2 AuthZ — workspace RBAC

| Action | owner | approver | member |
| --- | --- | --- | --- |
| View dashboard / pools / reports | ✓ | ✓ | ✓ |
| Create personal-style txn in team (non-pool) | ✓ | ✓ | ✓ (if enabled; MVP: pool expenses only for team spend) |
| Submit expense to pool | ✓ | ✓ | ✓ |
| Approve / reject | ✓ | ✓ | |
| Manage budget pools (CRUD) | ✓ | ✓ | |
| Manage members / roles | ✓ | | |
| Workspace settings / delete | ✓ | | |
| Export reports | ✓ | ✓ | ✓ |
| Manage FX rates | ✓ | ✓ | read-only |

Personal workspace: single member, always `owner`; approvals N/A.

```ts
// src/core/permissions/index.ts
export type PermissionAction =
  | "workspace.read"
  | "workspace.manage"
  | "members.manage"
  | "pool.manage"
  | "expense.submit"
  | "expense.decide"
  | "report.export"
  | "fx.manage";

export function can(role: MemberRole, action: PermissionAction): boolean;
export function assertCan(role: MemberRole, action: PermissionAction): void;
```

### 9.3 API enforcement

Every mutating route:

1. Session → `userId`  
2. Membership for `workspaceId`  
3. `assertCan`  
4. Proceed  

Never trust client-sent `role`. Approvers cannot escalate to owner.

### 9.4 Approval integrity

- Only `status === "submitted"` can be decided.  
- On approve: set txn `isPosted: true`, attach reviewer, atomically update pool spend.  
- On reject: `isPosted` remains false; optional comment required if workspace setting `requireRejectNote` (v1 default off; UI supports optional).

---

## 10. Design system tokens

### 10.1 Color

| Token | Value | Usage |
| --- | --- | --- |
| `--nl-bg` | `#121212` | App background |
| `--nl-surface` | `#1E1E1E` | Elevated surfaces, cards, drawers |
| `--nl-surface-hover` | `#242424` | Hover |
| `--nl-border` | `#2A2A2A` | Borders, dividers |
| `--nl-accent` | `#52D3FE` | Primary CTA, focus rings, links, active nav |
| `--nl-accent-muted` | `#52D3FE33` | Selection wash |
| `--nl-positive` | `#3DDC97` | Income, under-budget, goal on-track (aligns with Flow success) |
| `--nl-negative` | `#D9A759` | Overspend, overdue, reject emphasis (desaturated amber) |
| `--nl-warning` | `#D9A759` | Threshold alerts (same family as negative; use iconography to distinguish) |
| `--nl-text` | `#F5F5F5` | Primary text |
| `--nl-text-muted` | `#A3A3A3` | Secondary |
| `--nl-text-on-accent` | `#0A0A0A` | Text on filled cyan buttons (AA) |

Dark-only: `color-scheme: dark;` on `html`. No light theme toggle.

**Semantic mapping for money**

- Positive delta / income / remaining > 0 under budget → `--nl-positive`  
- Negative delta / overspend / rejected → `--nl-negative`  
- Neutral balances → `--nl-text`  
- Interactive affordances stay `--nl-accent` (do not use cyan for “good money” — keeps accent reserved for UI chrome)

### 10.2 Typography

| Role | Family | Notes |
| --- | --- | --- |
| UI / body | **Inter** | 14/16 body; semibold section titles |
| Numerals | **JetBrains Mono** | amounts, balances, %, dates, FX rates — `tabular-nums` |

```tsx
// MoneyText always applies font-mono + tabular-nums
<span className="font-mono tabular-nums tracking-tight">…</span>
```

### 10.3 Spacing, radius, elevation

```text
spacing: 4, 8, 12, 16, 24, 32, 48, 64
radius: sm 6px, md 10px, lg 14px
shadow: prefer border + surface lift; avoid multi-layer glow
focus: 2px solid var(--nl-accent) offset 2px
```

### 10.4 Tailwind v4 mapping (`globals.css`)

```css
@theme {
  --color-nl-bg: #121212;
  --color-nl-surface: #1e1e1e;
  --color-nl-border: #2a2a2a;
  --color-nl-accent: #52d3fe;
  --color-nl-positive: #3ddc97;
  --color-nl-negative: #d9a759;
  --color-nl-warning: #d9a759;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

Contrast: filled primary buttons use cyan background + `#0A0A0A` label; body text `#F5F5F5` on `#121212` / `#1E1E1E` meets AA.

---

## 11. Key interaction specs

### 11.1 Transaction entry (personal)

1. Open composer: `C` or Cmd+K → “Add transaction” or FAB on mobile.  
2. Form (RHF + Zod): type, amount (major units string → minor), currency (default base), category, date, note, optional receipt.  
3. Validate: amount > 0 (expense/income), currency in ISO list, receipt ≤ 8 MB & allowed MIME.  
4. Optimistic insert + budget bar animate.  
5. Receipt: upload first (or parallel); show thumbnail preview; failure keeps txn without receipt and toasts retry.  
6. Esc closes; focus returns to invoker.

### 11.2 Team expense submission + approval

```text
Member opens /expenses/new
  → select BudgetPool, amount, category, receipt (required for MVP team?)
  → POST /expenses → status submitted, isPosted false
  → publish expense.submitted on pool + approvals channels
  → Approver sees ApprovalsInbox badge
  → Approve: decide endpoint → isPosted true, pool spend++, expense.approved
  → Reject: note optional → expense.rejected
  → Submitter notification (in-app; email optional)
```

**UI:** Approval card shows receipt preview, amount (mono), pool remaining **before/after** projection, Approve (cyan) / Reject (amber outline).

### 11.3 Budget pool live-update behavior

- Pool detail mounts `BudgetPoolRealtime`.  
- Remaining = `limitAmountMinor - currentSpendMinor`.  
- On `expense.approved` from another user: update meter + mono remaining with Framer Motion; toast soft “Approved by {name}” if not self.  
- Presence avatars top-right: “Viewing”.  
- If overspend: meter uses `--nl-negative`; remaining shows negative with amber.

### 11.4 Receipt upload / preview

- Dropzone + file picker; paste image from clipboard (nice-to-have v1).  
- Preview in drawer: image lightbox or PDF embed.  
- Store `receiptStorageKey`; serve via signed URL.  
- Strip EXIF on server when feasible (privacy).

### 11.5 Command palette (Cmd+K)

- Library: **cmdk**  
- Actions: Add transaction, Submit expense (if team), Go to pool, Switch workspace, Open approvals, Export report, Settings  
- Debounced search → `/api/search`  
- Esc restores focus  

### 11.6 Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl+K` | Command palette |
| `C` | New transaction / expense (context-aware) |
| `G` then `D` | Dashboard |
| `G` then `T` | Transactions |
| `G` then `A` | Approvals (if allowed) |
| `/` | Focus filter |
| `Esc` | Close overlay |
| `Cmd/Ctrl+Enter` | Submit focused form |

Ignore when typing in inputs (except palette).

### 11.7 Notifications

- In-app bell via `user:{id}` realtime + React Query list.  
- Optional email: server flags `emailRequested`; send via Identity email service or Ledger SMTP (v1).  
- Triggers: budget ≥ alert threshold, approval requested, approval decided, goal reached.

---

## 12. Export / reporting design

### 12.1 CSV

- Route Handler streams CSV from cursor over transactions (workspace-scoped filters).  
- Columns: date, type, amount, currency, base_amount, category, pool, note, status, created_by.  
- Amounts as decimal strings with explicit currency code (never locale-ambiguous alone).  
- Client: `ExportMenu` → download blob or redirect to signed temp URL.

### 12.2 PDF

- **Server-side** `@react-pdf/renderer` templates in `src/server/exports/`.  
- Templates: Personal period summary; Team pool report; Approval audit excerpt.  
- Include Noirly wordmark, date range, mono-formatted totals, category breakdown table.  
- Generate to object storage or stream `application/pdf` response for MVP.  
- Puppeteer HTML→PDF reserved as escape hatch if react-pdf layout limits hit (v2).

### 12.3 Report builder UI

- Range picker + entity scope (personal / pool / whole workspace).  
- Format toggle CSV | PDF.  
- Disabled while job runs; toast on completion.  
- Large exports (>10k rows): async job + notification with download link (v1).

---

## 13. Phased build roadmap

### Phase 0 — Foundations (week 1)

- pnpm scaffold, tokens, Inter + JetBrains Mono  
- Auth.js + Identity client `noirly-ledger`  
- Mongoose models + personal workspace bootstrap + seed categories  
- App shell + workspace switcher  
- `LedgerSyncProvider` + Mongo adapter stub  
- `proxy.ts` session gate  

### Phase 1 — MVP Personal (weeks 2–4)

- Transaction CRUD + receipt upload  
- Categories (system + custom)  
- Category budgets + progress bars  
- Recurring transactions (basic frequencies)  
- Savings goals  
- Slim FX: base currency + user rates + converted display  
- Dashboard charts (Recharts) + accessible tables  
- Command palette (create + navigate)  
- Responsive layouts  

**Exit:** Solo user can track spend, budgets, goals without team features.

### Phase 2 — MVP Team (weeks 5–7)

- Team workspaces + members + roles  
- Budget pools CRUD  
- Expense submit + approval inbox  
- RBAC on API + UI  
- noirly-realtime pool channels + presence  
- Optimistic approve/reject with authoritative reconcile  
- In-app notifications for approvals  

**Exit:** Two browsers on one pool see live remaining balance; members cannot approve.

### Phase 3 — v1 (weeks 8–11)

- CSV + PDF exports  
- Email notifications (optional)  
- Budget threshold alerts  
- Report builder polish  
- Virtualized transaction tables  
- Playwright E2E (auth, submit/approve, permissions, FX display)  
- Recurring engine job (generate due instances)

### Phase 4 — v2

- Extract `packages/ledger-core` into Turborepo  
- Mobile app against same API  
- Live FX provider adapter (still behind interface)  
- Banking import / CSV import mapping  
- Shared org directory with Identity `organizations` (optional)  
- Multi-approver policies / thresholds  

---

## Appendix A — Environment variables

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3003
MONGODB_URI=mongodb://127.0.0.1:27017/noirly-ledger

# Auth.js / Noirly Identity
AUTH_SECRET=...
AUTH_NOIRLY_ISSUER=http://localhost:3000
AUTH_NOIRLY_CLIENT_ID=noirly-ledger
AUTH_NOIRLY_CLIENT_SECRET=...

# noirly-realtime
REALTIME_JWT_SECRET=...
NEXT_PUBLIC_REALTIME_WS_URL=ws://127.0.0.1:4001/ws
REDIS_URL=...

# Receipts
RECEIPT_STORAGE_DRIVER=s3
RECEIPT_S3_BUCKET=noirly-ledger-receipts
RECEIPT_S3_ENDPOINT=...
RECEIPT_S3_ACCESS_KEY=...
RECEIPT_S3_SECRET_KEY=...

# Email (v1)
SMTP_URL=...
# or Identity mail relay
```

## Appendix B — Testing strategy

| Layer | Tool |
| --- | --- |
| Unit (money, permissions, budget periods, FX convert) | Vitest |
| Component a11y | Testing Library + axe |
| API (approve race, spend integrity) | Vitest + test DB |
| E2E | Playwright |

Critical unit tests: minor-unit math, FX conversion rounding, `assertCan` matrix, approve idempotency.

## Appendix C — Risk register

| Risk | Mitigation |
| --- | --- |
| Float money bugs | Integer minor units only; central `money` module |
| Dual-DB sprawl | Separate DB name; couple only on `identitySub` |
| Approve double-spend | Atomic status transition + single `$inc` / recompute |
| Realtime fanout | Scope channels per pool; short-lived JWTs |
| FX staleness | Show rate `effectiveFrom` + “rates are user-set” disclosure |
| Scope creep (bank sync) | Keep import behind provider; ship manual entry first |

## Appendix D — Implementation order checklist (first PRs)

1. pnpm + tokens + fonts  
2. Auth.js Noirly provider + session  
3. Mongoose models + personal workspace bootstrap  
4. Shell + workspace switcher  
5. Transactions CRUD + MoneyInput  
6. Categories + budgets  
7. Dashboard charts  
8. Receipts upload  
9. FX rates + converted display  
10. Savings goals + recurring  
11. Team workspaces + RBAC  
12. Budget pools + approvals  
13. noirly-realtime pool sync + presence  
14. Exports CSV/PDF  
15. Notifications  

## Appendix E — Alignment with Noirly Flow

| Concern | Flow | Ledger |
| --- | --- | --- |
| Auth | Identity OIDC | Same |
| DB | `noirly-flow` | `noirly-ledger` |
| Realtime package | `@noirly-dev/realtime-client` | Same |
| Roles | owner/editor/viewer | owner/approver/member |
| Optimistic + LWW | tasks | transactions / pools |
| Tokens | `--nf-*` | `--nl-*` (same palette values) |

---

*End of architecture document. Ready for implementation without further structural decisions unless product replaces Mongo, Identity, or noirly-realtime.*
