/*
 * Name: Aquino, Edrel P.
 * Date: November 18, 2026
 * Assignment: CSAPPD1 Final Project - LibroTrack
 */

const MILLISECONDS_PER_DAY = 86_400_000;

const toDate = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

/** Whole days past the given due date, or null when the loan is not yet past due. */
export const daysOverdue = (dueDate: string | null | undefined): number | null => {
  const due = toDate(dueDate);

  if (!due) {
    return null;
  }

  const elapsedDays = Math.floor((Date.now() - due.getTime()) / MILLISECONDS_PER_DAY);

  return elapsedDays > 0 ? elapsedDays : null;
};

/** Whole days remaining until the given due date, or null when the due date has passed. */
export const daysUntilDue = (dueDate: string | null | undefined): number | null => {
  const due = toDate(dueDate);

  if (!due) {
    return null;
  }

  const remainingDays = Math.floor((due.getTime() - Date.now()) / MILLISECONDS_PER_DAY);

  return remainingDays >= 0 ? remainingDays : null;
};

/** Local calendar date (YYYY-MM-DD) for a date input, N days from today. */
export const dateInputFromToday = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};
