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

/** Earliest selectable date for new reminders (today). */
export function minReminderDateIso(): string {
  return todayIsoDate();
}

export interface Time12Parts {
  hour12: number;
  minute: number;
  isPm: boolean;
}

/** Parse stored "HH:MM" (24h) into hour/minute. Defaults to 08:00. */
export function parseHourMinute(value?: string | null): { hour: number; minute: number } {
  if (value) {
    const [h, m] = value.split(':').map(Number);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      return {
        hour: Math.min(23, Math.max(0, Math.trunc(h))),
        minute: Math.min(59, Math.max(0, Math.trunc(m))),
      };
    }
  }
  return { hour: 8, minute: 0 };
}

/** Format 24h hour/minute as stored "HH:MM" (internal / API). */
export function formatHourMinute(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** User-facing clock: "4:46" (no leading zero on hour; minutes stay padded). */
export function formatDisplayHourMinute(hour: number, minute: number): string {
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

/** Format stored "HH:MM" for display. */
export function formatDisplayTime(time: string | null | undefined): string {
  if (!time?.trim()) return '';
  const { hour, minute } = parseHourMinute(time);
  return formatDisplayHourMinute(hour, minute);
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

/** Tomorrow as YYYY-MM-DD in the device local calendar. */
export function tomorrowIsoDate(): string {
  return addDaysToIsoDate(todayIsoDate(), 1);
}

export function isIsoDateTomorrow(iso: string | null | undefined): boolean {
  const datePart = normalizeToDatePart(iso);
  if (!datePart) return false;
  return datePart === addDaysToIsoDate(todayIsoDate(), 1);
}

/** 24-hour clock for reminder rows, e.g. "20:00". Never AM/PM. */
export function formatReminderClockTime(
  time: string | null | undefined,
  _locale?: string,
): string {
  const trimmed = time?.trim();
  if (!trimmed) return '';
  return formatDisplayTime(trimmed) || trimmed;
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
  const timeStr = formatReminderClockTime(time);
  if (!datePart) return timeStr;

  const dateStr = formatDisplayDate(datePart);
  const dateTime = timeStr ? `${dateStr}, ${timeStr}` : dateStr;

  if (datePart < todayIsoDate()) {
    return `${labels.sentSuccessfully}, ${dateTime}`;
  }
  return dateTime;
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

/** True if ISO date `a` is strictly after ISO date `b` (YYYY-MM-DD). */
export function isIsoDateAfter(a: string, b: string): boolean {
  return compareIsoDates(a, b) > 0;
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

/** Earliest HH:MM on `isoDate` that is still in the future. Null if the day is over. */
export function soonestValidReminderTime(isoDate: string): string | null {
  const date = parseIsoDate(isoDate);
  if (!date) return null;
  const now = new Date();
  const next = new Date(now.getTime() + 60_000);
  next.setSeconds(0, 0);
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 0, 0);
  const candidate = next.getTime() < start.getTime() ? start : next;
  if (candidate.getTime() > end.getTime()) return null;
  if (candidate.getTime() < now.getTime()) return null;
  return formatHourMinute(candidate.getHours(), candidate.getMinutes());
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

/** Format an ISO date (YYYY-MM-DD) or Date as DD/MM/YY for display. */
export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

/** Format an ISO date (YYYY-MM-DD) or Date as DD/MM/YYYY for display. */
export function formatDisplayDateLong(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
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
  return formatDisplayHourMinute(parsed.getHours(), parsed.getMinutes());
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
    const displayTime = timePart ? formatDisplayTime(timePart) : '';
    if (todayLabel && displayTime) return `${todayLabel} ${displayTime}`;
    if (todayLabel) return todayLabel;
    if (displayTime) return displayTime;
    return extractTimeFromIso(date ?? '');
  }

  if (datePart) return formatDisplayDate(datePart);
  if (timePart) return formatDisplayTime(timePart);
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

/** Truncate list preview text to first N chars with … when longer. */
export function truncatePreviewText(text: string | null | undefined, max = 20): string {
  const trimmed = text?.trim() ?? '';
  if (!trimmed) return '';
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

/** Truncate health record description for list subtitle. */
export function truncateHealthDescription(text: string | null | undefined, max = 20): string {
  return truncatePreviewText(text, max);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseApiDateTime(value: string | null | undefined): Date | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  const hasZone = /[zZ]$|[+-]\d{2}:\d{2}$/.test(trimmed);
  const parsed = new Date(hasZone ? trimmed : `${trimmed}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Health list footer: Created/Resolved + Today 17:15, Yesterday 20:11, or DD/MM/YY. */
export function formatHealthDateMeta(
  isoDateTime: string | null | undefined,
  labels: { today: string; yesterday: string; prefix: string },
): string {
  if (!isoDateTime) return '';
  const created = parseApiDateTime(isoDateTime);
  if (!created) return '';

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor(
    (startOfLocalDay(now).getTime() - startOfLocalDay(created).getTime()) / dayMs,
  );
  const time = formatDisplayHourMinute(created.getHours(), created.getMinutes());

  if (diffDays <= 0) {
    return `${labels.prefix} ${labels.today} ${time}`;
  }
  if (diffDays === 1) {
    return `${labels.prefix} ${labels.yesterday} ${time}`;
  }
  return `${labels.prefix} ${formatDisplayDate(created)}`;
}

/** @deprecated Use formatHealthDateMeta */
export function formatHealthCreatedLabel(
  isoDateTime: string | null | undefined,
  labels: { today: string; yesterday: string; createdPrefix: string },
): string {
  return formatHealthDateMeta(isoDateTime, {
    today: labels.today,
    yesterday: labels.yesterday,
    prefix: labels.createdPrefix,
  });
}

/** Local calendar day key (YYYY-MM-DD) for grouping notes. */
export function getNoteLocalDateKey(isoDateTime: string | null | undefined): string {
  const created = parseApiDateTime(isoDateTime);
  if (!created) return '';
  return toIsoDate(created);
}

/** Note timeline section header: Today, Yesterday, or DD.MM.YYYY. */
export function formatNoteSectionDateLabel(
  isoDateTime: string | null | undefined,
  labels: { today: string; yesterday: string },
): string {
  if (!isoDateTime) return '';
  const created = parseApiDateTime(isoDateTime);
  if (!created) return '';

  const now = new Date();
  const diffDays = Math.floor(
    (startOfLocalDay(now).getTime() - startOfLocalDay(created).getTime()) / DAY_MS,
  );

  if (diffDays <= 0) return labels.today;
  if (diffDays === 1) return labels.yesterday;
  return formatDisplayDateLong(created);
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
