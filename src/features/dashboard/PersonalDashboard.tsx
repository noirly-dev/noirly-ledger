"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/src/lib/api-client";
import { qk } from "@/src/core/sync/query-keys";
import { formatMinorToMajor } from "@/src/core/money";
import { MoneyText } from "@/src/ui/MoneyText";
import { ProgressBar } from "@/src/ui/ProgressBar";
import { AccessibleChart } from "@/src/components/AccessibleChart";
import { Button } from "@/src/ui/Button";
import { useUIStore } from "@/src/stores/ui-store";
import { useState } from "react";
import type { DateRangePreset } from "@/src/core/sync/types";

type Props = {
  workspaceId: string;
  baseCurrency: string;
  displayName: string;
};

const tooltipStyle = {
  background: "#1E1E1E",
  border: "1px solid #2A2A2A",
  borderRadius: 8,
  color: "#F5F5F5",
};

export function PersonalDashboard({ workspaceId, baseCurrency, displayName }: Props) {
  const [range, setRange] = useState<DateRangePreset>("mtd");
  const setOpen = useUIStore((s) => s.setTransactionComposerOpen);
  const dash = useQuery({
    queryKey: qk.dashboard(workspaceId, range),
    queryFn: () => api.dashboard(workspaceId, range),
  });
  const summary = dash.data?.summary;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-nl-accent">PERSONAL</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Welcome, {displayName}</h1>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "mtd"] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setRange(preset)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs uppercase ${
                range === preset
                  ? "bg-nl-surface text-nl-accent"
                  : "text-[#737373] hover:text-[#F5F5F5]"
              }`}
            >
              {preset}
            </button>
          ))}
          <Button onClick={() => setOpen(true)}>Add</Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Income"
          amount={summary?.incomeMinor ?? 0}
          currency={baseCurrency}
          tone="positive"
        />
        <Stat
          label="Spending"
          amount={summary?.expenseMinor ?? 0}
          currency={baseCurrency}
          tone="negative"
        />
        <Stat
          label="Net"
          amount={summary?.netMinor ?? 0}
          currency={baseCurrency}
          tone={(summary?.netMinor ?? 0) >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AccessibleChart
          title="Spending by category"
          summary={`${summary?.byCategory.length ?? 0} categories in range`}
          columns={[
            { key: "name", label: "Category" },
            { key: "amount", label: "Amount" },
          ]}
          rows={(summary?.byCategory ?? []).map((row) => ({
            name: row.name,
            amount: formatMinorToMajor(row.amountMinor),
          }))}
        >
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={summary?.byCategory ?? []}
                dataKey="amountMinor"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
              >
                {(summary?.byCategory ?? []).map((row) => (
                  <Cell key={row.categoryId ?? row.name} fill={row.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </AccessibleChart>

        <AccessibleChart
          title="Spending over time"
          summary={`${summary?.range.from} → ${summary?.range.to}`}
          columns={[
            { key: "date", label: "Date" },
            { key: "expense", label: "Expense" },
            { key: "income", label: "Income" },
          ]}
          rows={(summary?.overTime ?? []).map((row) => ({
            date: row.date,
            expense: formatMinorToMajor(row.expenseMinor),
            income: formatMinorToMajor(row.incomeMinor),
          }))}
        >
          <ResponsiveContainer>
            <BarChart data={summary?.overTime ?? []}>
              <CartesianGrid stroke="#2A2A2A" vertical={false} />
              <XAxis dataKey="date" stroke="#737373" fontSize={10} />
              <YAxis stroke="#737373" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="expenseMinor" fill="#D9A759" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </AccessibleChart>
      </div>

      <div className="mt-4">
        <AccessibleChart
          title="Net balance trend"
          summary="Income minus spending per day"
          columns={[
            { key: "date", label: "Date" },
            { key: "net", label: "Net" },
          ]}
          rows={(summary?.overTime ?? []).map((row) => ({
            date: row.date,
            net: formatMinorToMajor(row.incomeMinor - row.expenseMinor),
          }))}
        >
          <ResponsiveContainer>
            <LineChart
              data={(summary?.overTime ?? []).map((row) => ({
                date: row.date,
                net: row.incomeMinor - row.expenseMinor,
              }))}
            >
              <CartesianGrid stroke="#2A2A2A" vertical={false} />
              <XAxis dataKey="date" stroke="#737373" fontSize={10} />
              <YAxis stroke="#737373" fontSize={10} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="net" stroke="#52D3FE" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </AccessibleChart>
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-medium">Budget health</h2>
        <ul className="mt-3 space-y-3">
          {(summary?.budgets ?? []).map((row) => {
            const ratio = row.budget.limitAmountMinor
              ? row.spentMinor / row.budget.limitAmountMinor
              : 0;
            return (
              <li key={row.budget.id} className="rounded-xl border border-nl-border bg-nl-surface p-4">
                <ProgressBar value={ratio} tone={ratio > 1 ? "negative" : "accent"} />
                <div className="mt-2 flex justify-between text-xs text-[#A3A3A3]">
                  <span>Spent</span>
                  <MoneyText
                    amountMinor={row.remainingMinor}
                    currency={row.budget.currency}
                    tone={row.remainingMinor < 0 ? "negative" : "positive"}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

function Stat({
  label,
  amount,
  currency,
  tone,
}: {
  label: string;
  amount: number;
  currency: string;
  tone: "positive" | "negative";
}) {
  return (
    <div className="rounded-xl border border-nl-border bg-nl-surface p-5">
      <p className="text-xs text-[#737373]">{label}</p>
      <p className="mt-2 text-xl">
        <MoneyText amountMinor={amount} currency={currency} tone={tone} />
      </p>
    </div>
  );
}
