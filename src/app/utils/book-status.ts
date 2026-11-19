/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-19
 * Title: Overdue status and dashboard summary helpers
 */

import { Book, BookStatus } from '../models/book.model';

const MILLISECONDS_PER_DAY = 86_400_000;
const CALENDAR_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

export interface BookSummaryCounts {
  available: number;
  borrowed: number;
  overdue: number;
  total: number;
}

/**
 * Converts a due date or reference date to a stable calendar-day number.
 *
 * Date-only values (for example `2026-11-19`) are read as calendar dates and
 * are not shifted by the local time zone. Full timestamps fall back to the
 * local calendar date. Invalid values return null.
 */
const toCalendarDay = (value: string | Date | null | undefined): number | null => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const match = CALENDAR_DATE_PREFIX.exec(value);

    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const calendarDay = Date.UTC(year, month - 1, day);
      const check = new Date(calendarDay);

      if (
        check.getUTCFullYear() !== year ||
        check.getUTCMonth() !== month - 1 ||
        check.getUTCDate() !== day
      ) {
        return null;
      }

      return calendarDay;
    }
  }

  const date = typeof value === 'string' ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
};

/**
 * Whole calendar days past the given due date.
 * Returns 0 when the loan is due today, not yet due, or has no valid due date.
 */
export const getDaysOverdue = (
  dueDate: string | null | undefined,
  now: Date = new Date(),
): number => {
  const dueDay = toCalendarDay(dueDate);
  const currentDay = toCalendarDay(now);

  if (dueDay === null || currentDay === null) {
    return 0;
  }

  const elapsedDays = Math.round((currentDay - dueDay) / MILLISECONDS_PER_DAY);

  return elapsedDays > 0 ? elapsedDays : 0;
};

/**
 * Whether a book should be treated as overdue.
 *
 * Available books are never overdue. A book explicitly marked overdue stays
 * overdue, and any other loan becomes overdue once its due date has passed.
 */
export const isBookOverdue = (book: Book, now: Date = new Date()): boolean => {
  if (book.status === 'available') {
    return false;
  }

  if (book.status === 'overdue') {
    return true;
  }

  return getDaysOverdue(book.dueDate, now) > 0;
};

/**
 * The live status for a book, correcting a `borrowed` record whose due date
 * has already passed.
 */
export const getEffectiveStatus = (book: Book, now: Date = new Date()): BookStatus => {
  if (book.status === 'available') {
    return 'available';
  }

  return isBookOverdue(book, now) ? 'overdue' : 'borrowed';
};

/**
 * Dashboard totals derived from effective, date-aware statuses.
 */
export const getSummaryCounts = (
  books: readonly Book[],
  now: Date = new Date(),
): BookSummaryCounts => {
  const counts: BookSummaryCounts = {
    available: 0,
    borrowed: 0,
    overdue: 0,
    total: books.length,
  };

  for (const book of books) {
    counts[getEffectiveStatus(book, now)] += 1;
  }

  return counts;
};
