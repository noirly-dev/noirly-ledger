import type { RecurrenceFrequency } from "@/src/core/models/enums";

export type RecurrenceInput = {
  frequency: RecurrenceFrequency;
  interval: number;
  byMonthDay?: number;
  until?: string | Date | null;
};

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function clampMonthDay(year: number, month: number, day: number): number {
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Math.min(day, last);
}

/** Advance one recurrence step in UTC. */
export function nextOccurrence(from: Date, rule: RecurrenceInput): Date {
  const interval = Math.max(1, rule.interval || 1);
  const start = startOfUtcDay(from);

  if (rule.frequency === "daily") {
    return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + interval));
  }
  if (rule.frequency === "weekly") {
    return new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 7 * interval),
    );
  }
  if (rule.frequency === "yearly") {
    return new Date(
      Date.UTC(start.getUTCFullYear() + interval, start.getUTCMonth(), start.getUTCDate()),
    );
  }

  const day = rule.byMonthDay ?? start.getUTCDate();
  const monthIndex = start.getUTCMonth() + interval;
  const year = start.getUTCFullYear() + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;
  return new Date(Date.UTC(year, month, clampMonthDay(year, month, day)));
}

/**
 * Occurrences strictly after `lastPosted` and on/before `asOf`, honoring `until`.
 * Caps at `limit` so a missed year of daily rules cannot explode.
 */
export function dueOccurrences(
  lastPosted: Date,
  rule: RecurrenceInput,
  asOf = new Date(),
  limit = 24,
): Date[] {
  const until = rule.until ? startOfUtcDay(new Date(rule.until)) : null;
  const end = startOfUtcDay(asOf);
  const dates: Date[] = [];
  let cursor = nextOccurrence(lastPosted, rule);

  while (dates.length < limit && cursor.getTime() <= end.getTime()) {
    if (until && cursor.getTime() > until.getTime()) break;
    dates.push(cursor);
    cursor = nextOccurrence(cursor, rule);
  }
  return dates;
}
