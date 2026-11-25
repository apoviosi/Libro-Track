/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-19
 * Title: Overdue status and dashboard summary tests
 */

import { Book } from '../models/book.model';
import { getDaysOverdue, getEffectiveStatus, getSummaryCounts, isBookOverdue } from './book-status';

const NOW = new Date(2026, 10, 19, 12, 0, 0);

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  title: 'Clean Code',
  author: 'Robert C. Martin',
  isbn: '9780132350884',
  status: 'borrowed',
  borrower: 'Jane Doe',
  dueDate: '2026-11-19',
  ...overrides,
});

describe('getDaysOverdue', () => {
  it('returns 0 when the due date is today', () => {
    expect(getDaysOverdue('2026-11-19', NOW)).toBe(0);
  });

  it('returns 0 when the due date is in the future', () => {
    expect(getDaysOverdue('2026-11-20', NOW)).toBe(0);
  });

  it('returns 1 when the due date was yesterday', () => {
    expect(getDaysOverdue('2026-11-18', NOW)).toBe(1);
  });

  it('counts whole calendar days past the due date', () => {
    expect(getDaysOverdue('2026-11-09', NOW)).toBe(10);
  });

  it('returns 0 for a missing due date', () => {
    expect(getDaysOverdue(null, NOW)).toBe(0);
    expect(getDaysOverdue(undefined, NOW)).toBe(0);
  });

  it('returns 0 for an invalid due date', () => {
    expect(getDaysOverdue('not-a-date', NOW)).toBe(0);
    expect(getDaysOverdue('2026-02-30', NOW)).toBe(0);
  });

  it('ignores the time of day when comparing calendar dates', () => {
    const early = new Date(2026, 10, 19, 0, 1, 0);
    const late = new Date(2026, 10, 19, 23, 59, 0);

    expect(getDaysOverdue('2026-11-18', early)).toBe(1);
    expect(getDaysOverdue('2026-11-18', late)).toBe(1);
  });
});

describe('isBookOverdue', () => {
  it('never marks an available book overdue, even with a past due date', () => {
    expect(isBookOverdue(makeBook({ status: 'available', dueDate: '2026-11-01' }), NOW)).toBe(
      false,
    );
  });

  it('does not mark a book overdue on its due date', () => {
    expect(isBookOverdue(makeBook({ dueDate: '2026-11-19' }), NOW)).toBe(false);
  });

  it('does not mark a book overdue before its due date', () => {
    expect(isBookOverdue(makeBook({ dueDate: '2026-11-25' }), NOW)).toBe(false);
  });

  it('marks a borrowed book overdue once its due date has passed', () => {
    expect(isBookOverdue(makeBook({ dueDate: '2026-11-18' }), NOW)).toBe(true);
  });

  it('keeps an explicitly overdue book overdue', () => {
    expect(isBookOverdue(makeBook({ status: 'overdue', dueDate: null }), NOW)).toBe(true);
  });

  it('treats a borrowed book without a due date as not overdue', () => {
    expect(isBookOverdue(makeBook({ dueDate: null }), NOW)).toBe(false);
  });
});

describe('getEffectiveStatus', () => {
  it('returns available for available books', () => {
    expect(getEffectiveStatus(makeBook({ status: 'available', dueDate: null }), NOW)).toBe(
      'available',
    );
  });

  it('returns borrowed while the due date is still in the future', () => {
    expect(getEffectiveStatus(makeBook({ dueDate: '2026-11-25' }), NOW)).toBe('borrowed');
  });

  it('promotes a stale borrowed book to overdue after its due date', () => {
    expect(getEffectiveStatus(makeBook({ dueDate: '2026-11-18' }), NOW)).toBe('overdue');
  });

  it('keeps an explicitly overdue book overdue', () => {
    expect(getEffectiveStatus(makeBook({ status: 'overdue', dueDate: '2026-12-01' }), NOW)).toBe(
      'overdue',
    );
  });
});

describe('getSummaryCounts', () => {
  it('returns zeroed counts for an empty catalog', () => {
    expect(getSummaryCounts([], NOW)).toEqual({
      available: 0,
      borrowed: 0,
      overdue: 0,
      total: 0,
    });
  });

  it('counts each effective status and the total catalog size', () => {
    const books: Book[] = [
      makeBook({ status: 'available', dueDate: null }),
      makeBook({ status: 'available', dueDate: null }),
      makeBook({ status: 'borrowed', dueDate: '2026-11-25' }),
      makeBook({ status: 'borrowed', dueDate: '2026-11-18' }),
      makeBook({ status: 'borrowed', dueDate: '2026-11-01' }),
      makeBook({ status: 'overdue', dueDate: null }),
    ];

    expect(getSummaryCounts(books, NOW)).toEqual({
      available: 2,
      borrowed: 1,
      overdue: 3,
      total: 6,
    });
  });
});
