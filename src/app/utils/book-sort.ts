/**
 * Name: Aquino, Edrel P.
 * Date: November 26, 2026
 * Title: Catalog sort helpers
 */

import { Book, BookStatus } from '../models/book.model';

export type BookSortOption =
  'recent' | 'title-asc' | 'title-desc' | 'author-asc' | 'status' | 'due-date';

export const BOOK_SORT_OPTIONS: ReadonlyArray<{ value: BookSortOption; label: string }> = [
  { value: 'recent', label: 'Recently added' },
  { value: 'title-asc', label: 'Title (A–Z)' },
  { value: 'title-desc', label: 'Title (Z–A)' },
  { value: 'author-asc', label: 'Author (A–Z)' },
  { value: 'status', label: 'Status (Overdue first)' },
  { value: 'due-date', label: 'Due date (Soonest first)' },
];

const STATUS_SORT_ORDER: Record<BookStatus, number> = {
  overdue: 0,
  borrowed: 1,
  available: 2,
};

const isBookSortOption = (value: string | undefined): value is BookSortOption =>
  BOOK_SORT_OPTIONS.some((option) => option.value === value);

export const parseBookSortOption = (value: string | undefined): BookSortOption =>
  isBookSortOption(value) ? value : 'recent';

const timestamp = (value: string | null | undefined): number => {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

const dueTimestamp = (value: string | null | undefined): number =>
  timestamp(value) === Number.NEGATIVE_INFINITY ? Number.POSITIVE_INFINITY : timestamp(value);

const compareTitles = (a: Book, b: Book): number => a.title.localeCompare(b.title);

/** Returns a new array sorted by the requested catalog order. */
export const sortBooks = (books: readonly Book[], option: BookSortOption): Book[] => {
  const sorted = [...books];

  switch (option) {
    case 'recent':
      return sorted.sort(
        (a: Book, b: Book) =>
          timestamp(b.createdAt) - timestamp(a.createdAt) || compareTitles(a, b),
      );
    case 'title-asc':
      return sorted.sort(compareTitles);
    case 'title-desc':
      return sorted.sort((a: Book, b: Book) => b.title.localeCompare(a.title));
    case 'author-asc':
      return sorted.sort(
        (a: Book, b: Book) => a.author.localeCompare(b.author) || compareTitles(a, b),
      );
    case 'status':
      return sorted.sort(
        (a: Book, b: Book) =>
          STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status] || compareTitles(a, b),
      );
    case 'due-date':
      return sorted.sort(
        (a: Book, b: Book) =>
          dueTimestamp(a.dueDate) - dueTimestamp(b.dueDate) || compareTitles(a, b),
      );
  }
};
