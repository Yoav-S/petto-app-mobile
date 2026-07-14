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

/** Earliest selectable date for new reminders (tomorrow). */
export function minReminderDateIso(): string {
  return addDaysToIsoDate(todayIsoDate(), 1);
}

export interface Time12Parts {
  hour12: number;
  minute: number;
  isPm: boolean;
}

/** Parse "HH:MM" (24h) into 12-hour parts. Defaults to 8:00 AM. */
export function parseTime24(value?: string | null): Time12Parts {
  if (value) {
    const [h, m] = value.split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      const isPm = h >= 12;
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return { hour12, minute: m, isPm };
    }
  }
  return { hour12: 8, minute: 0, isPm: false };
}

/** Convert 12-hour parts to stored "HH:MM" (24h). 8 AM -> 08:00, 8 PM -> 20:00. */
export function toTime24(hour12: number, minute: number, isPm: boolean): string {
  let hour24: number;
  if (hour12 === 12) {
    hour24 = isPm ? 12 : 0;
  } else {
    hour24 = isPm ? hour12 + 12 : hour12;
  }
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function addDaysToIsoDate(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return toIsoDate(next);
}

export function isIsoDateTomorrow(iso: string | null | undefined): boolean {
  const datePart = normalizeToDatePart(iso);
  if (!datePart) return false;
  return datePart === addDaysToIsoDate(todayIsoDate(), 1);
}

/** 12-hour clock for reminder rows, e.g. "8:00 PM". */
export function formatReminderClockTime(
  time: string | null | undefined,
  locale?: string,
): string {
  const trimmed = time?.trim();
  if (!trimmed) return '';
  const [h, m] = trimmed.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return trimmed;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
}

function parseDatePartToLocalDate(datePart: string): Date | null {
  const parsed = parseIsoDate(datePart);
  return parsed ?? null;
}

/** Short month + day for future reminders, e.g. "Apr 21". */
export function formatReminderMonthDay(
  isoDate: string | null | undefined,
  locale?: string,
): string {
  const datePart = normalizeToDatePart(isoDate);
  if (!datePart) return '';
  const date = parseDatePartToLocalDate(datePart);
  if (!date) return '';
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

/** Month name for past reminders, e.g. "March". */
export function formatReminderMonthName(
  isoDate: string | null | undefined,
  locale?: string,
): string {
  const datePart = normalizeToDatePart(isoDate);
  if (!datePart) return '';
  const date = parseDatePartToLocalDate(datePart);
  if (!date) return '';
  return date.toLocaleDateString(locale, { month: 'long' });
}

export interface HealthReminderLabels {
  today: string;
  tomorrow: string;
  sentSuccessfully: string;
}

/** Value portion after "Reminder:" — Today/Tomorrow/date + clock time, or sent successfully. */
export function formatHealthReminderValue(
  date: string | null | undefined,
  time: string | null | undefined,
  labels: HealthReminderLabels,
  locale?: string,
): string {
  const datePart = normalizeToDatePart(date);
  const timeStr = formatReminderClockTime(time, locale);
  if (!datePart) return timeStr;

  const today = todayIsoDate();
  if (datePart < today) {
    const month = formatReminderMonthName(datePart, locale);
    return month ? `${labels.sentSuccessfully}, ${month}, ${timeStr}` : labels.sentSuccessfully;
  }
  if (isIsoDateToday(datePart)) {
    return timeStr ? `${labels.today}, ${timeStr}` : labels.today;
  }
  if (isIsoDateTomorrow(datePart)) {
    return timeStr ? `${labels.tomorrow}, ${timeStr}` : labels.tomorrow;
  }
  const monthDay = formatReminderMonthDay(datePart, locale);
  return timeStr ? `${monthDay}, ${timeStr}` : monthDay;
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const datePart = value.length >= 10 ? value.slice(0, 10) : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const [y, m, d] = datePart.split('-').map(Number);
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

/** True when a local reminder date+time (YYYY-MM-DD, HH:MM) is already in the past. */
export function isReminderDateTimeInPast(isoDate: string, time: string): boolean {
  const date = parseIsoDate(isoDate);
  if (!date) return true;
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return true;
  const scheduled = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m, 0, 0);
  const now = new Date();
  now.setSeconds(0, 0);
  return scheduled.getTime() < now.getTime();
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

/** True if an ISO date (YYYY-MM-DD) is the same calendar day as today. */
export function isIsoDateToday(iso: string | null | undefined): boolean {
  const datePart = normalizeToDatePart(iso);
  if (!datePart) return false;
  const parsed = parseIsoDate(datePart);
  if (!parsed) return false;
  return isSameDay(parsed, new Date());
}

/** Normalize API / display dates to YYYY-MM-DD when possible. */
export function normalizeToDatePart(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);

  const isoParsed = parseIsoDate(trimmed);
  if (isoParsed) return toIsoDate(isoParsed);

  const dotted = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{2,4})$/);
  if (dotted) {
    const year = dotted[3].length === 2 ? `20${dotted[3]}` : dotted[3];
    return `${year}-${dotted[2]}-${dotted[1]}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return toIsoDate(parsed);
  return null;
}

function extractTimeFromIso(value: string): string {
  if (!value || value.length <= 10) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`;
}

/** List meta: "Today HH:MM" when due today, otherwise formatted date. */
export function formatListDateOrTime(
  date: string | null | undefined,
  time?: string | null | undefined,
  todayLabel?: string,
): string {
  const timePart = time?.trim() ?? '';
  const datePart = normalizeToDatePart(date ?? undefined);

  if (datePart && isIsoDateToday(datePart)) {
    if (todayLabel && timePart) return `${todayLabel} ${timePart}`;
    if (todayLabel) return todayLabel;
    if (timePart) return timePart;
    return extractTimeFromIso(date ?? '');
  }

  if (datePart) return formatDisplayDate(datePart);
  if (timePart) return timePart;
  if (date) return formatDisplayDate(date);
  return '';
}

/** @deprecated Use formatListDateOrTime */
export function formatReminderListMeta(
  isoDate: string | null | undefined,
  time: string | null | undefined,
  _todayLabel?: string,
): string {
  return formatListDateOrTime(isoDate, time);
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
