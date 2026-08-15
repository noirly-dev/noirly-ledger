export function crossedThreshold(input: {
  previousSpentMinor: number;
  nextSpentMinor: number;
  limitAmountMinor: number;
  alertThresholdPct: number;
}): boolean {
  if (input.limitAmountMinor <= 0) return false;
  const line = Math.round((input.limitAmountMinor * input.alertThresholdPct) / 100);
  return input.previousSpentMinor < line && input.nextSpentMinor >= line;
}

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function csvLine(cells: Array<string | number | null | undefined>): string {
  return cells
    .map((cell) => csvEscape(cell == null ? "" : String(cell)))
    .join(",");
}
