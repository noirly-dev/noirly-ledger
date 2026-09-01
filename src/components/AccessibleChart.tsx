"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@noirly-dev/ui";

type Column = { key: string; label: string };
type Row = Record<string, string | number>;

type Props = {
  title: string;
  summary: string;
  columns: Column[];
  rows: Row[];
  children: ReactNode;
};

export function AccessibleChart({ title, summary, columns, rows, children }: Props) {
  const [table, setTable] = useState(false);
  return (
    <section className="surface grain relative rounded-[var(--r-lg)] border border-[var(--hairline)] shadow-[var(--elev-1)] bg-[var(--surface)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{summary}</p>
        </div>
        <Button variant="ghost" className="h-8 px-3 text-xs" onClick={() => setTable((v) => !v)}>
          {table ? "View chart" : "View as table"}
        </Button>
      </div>
      {table ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="text-[var(--muted-foreground)]">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} className="px-2 py-1 font-medium">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-t border-[var(--hairline)]">
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 py-1 font-mono tabular-nums">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-56" aria-hidden>
          {children}
        </div>
      )}
    </section>
  );
}
