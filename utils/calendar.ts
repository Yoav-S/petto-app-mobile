export interface CalendarCell {
  date: Date;
  day: number;
  inCurrentMonth: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function getCalendarCells(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = startWeekday - 1; i >= 0; i -= 1) {
    const day = daysInPrevMonth - i;
    cells.push({
      date: new Date(year, month - 1, day),
      day,
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(year, month, day),
      day,
      inCurrentMonth: true,
    });
  }

  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      date: new Date(year, month + 1, nextDay),
      day: nextDay,
      inCurrentMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add calendar years to an ISO date string (YYYY-MM-DD). */
export function addYearsToIsoDate(iso: string, years: number): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return toIsoDate(next);
}

export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function parseIsoDate(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Compare ISO dates (YYYY-MM-DD). Returns negative if a < b, 0 if equal, positive if a > b. */
export function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b);
}

/** True if ISO date `a` is strictly before `b`. */
export function isIsoDateBefore(a: string, b: string): boolean {
  return compareIsoDates(a, b) < 0;
}

/** True if `date` is strictly before `minIso` (YYYY-MM-DD). */
export function isBeforeIsoDate(date: Date, minIso: string): boolean {
  return isIsoDateBefore(toIsoDate(date), minIso);
}

/** True if `date` is strictly after today (ignoring time-of-day). */
export function isFutureDate(date: Date): boolean {
  const today = new Date();
  const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  return date.getTime() > endOfToday.getTime();
}

export function getYearOptions(options?: { pastYears?: number; futureYears?: number }): number[] {
  const { pastYears = 30, futureYears = 0 } = options ?? {};
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + futureYears; y >= current - pastYears; y -= 1) {
    years.push(y);
  }
  return years;
}

/** Format an ISO date (YYYY-MM-DD) or Date as DD.MM.YY for display. */
export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

/** Format an ISO date (YYYY-MM-DD) or Date as DD.MM.YYYY for display. */
export function formatDisplayDateLong(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}.${month}.${year}`;
}

export const MONTH_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const;

export const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
