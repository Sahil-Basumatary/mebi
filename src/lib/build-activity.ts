export type BuildDay = {
  date: string;
  count: number;
};

// One real ProjectUpdate (or other attested activity). Bucketed on the client
// in the viewer's timezone so late-evening work lands on the right day.
export type BuildEvent = {
  at: string;
};

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
}

function dayProxy(key: string): Date {
  return new Date(`${key}T12:00:00.000Z`);
}

function proxyKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function buildActivityYear(
  events: BuildEvent[],
  timeZone = "UTC",
  now = new Date(),
): BuildDay[] {
  const format = dayFormatter(timeZone);
  const end = dayProxy(format.format(now));
  const start = addDays(end, -364 - ((end.getUTCDay() + 6) % 7));
  const startKey = proxyKey(start);
  const endKey = proxyKey(end);
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = format.format(new Date(event.at));
    if (key < startKey || key > endKey) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const days: BuildDay[] = [];
  for (let cursor = start; proxyKey(cursor) <= endKey; cursor = addDays(cursor, 1)) {
    const key = proxyKey(cursor);
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return days;
}

export function activityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

export type ActivitySummary = {
  total: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  busiest: BuildDay | null;
};

export function summarizeActivity(days: BuildDay[]): ActivitySummary {
  let total = 0;
  let activeDays = 0;
  let longestStreak = 0;
  let running = 0;
  let busiest: BuildDay | null = null;
  for (const day of days) {
    total += day.count;
    if (day.count > 0) {
      activeDays += 1;
      running += 1;
      longestStreak = Math.max(longestStreak, running);
      if (!busiest || day.count > busiest.count) busiest = day;
    } else {
      running = 0;
    }
  }
  let currentStreak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (days[index].count > 0) {
      currentStreak += 1;
      continue;
    }
    if (index === days.length - 1) continue;
    break;
  }
  return { total, activeDays, currentStreak, longestStreak, busiest };
}
