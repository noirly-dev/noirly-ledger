"use client";

import { useState, type ReactNode } from "react";
import { Button, Card, CardHeader, CardTitle, DataTable } from "@noirly-dev/ui";

type Column = { key: string; label: string };
type Row = Record<string, string | number>;

type Props = {
  title: string;
  summary: string;
  columns: Column[];
  rows: Row[];
  children: ReactNode;
};

/**
 * A chart with a table underneath it for anyone who cannot read the chart.
 *
 * The panel is a <Card> now rather than a hand-assembled `surface grain border
 * shadow-… bg-…` stack. That combination was quietly cancelling itself: the
 * Tailwind `shadow-*` utility replaces the whole box-shadow, which threw away
 * the inset hairline and the sheen `.surface` had just drawn, and the explicit
 * `bg-[var(--surface)]` overrode the card gradient on top of that.
 */
export function AccessibleChart({ title, summary, columns, rows, children }: Props) {
  const [table, setTable] = useState(false);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <p className="meta mt-1">{summary}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setTable((v) => !v)}>
          {table ? "View chart" : "View as table"}
        </Button>
      </CardHeader>

      {table ? (
        <DataTable
          caption={title}
          rows={rows}
          rowKey={(_, index) => String(index)}
          columns={columns.map((col, i) => ({
            id: col.key,
            header: col.label,
            // First column identifies the row; the rest are figures.
            primary: i === 0,
            numeric: i > 0,
            cell: (row: Row) => row[col.key],
          }))}
        />
      ) : (
        <div className="h-56 px-5 pb-5" aria-hidden>
          {children}
        </div>
      )}
    </Card>
  );
}
