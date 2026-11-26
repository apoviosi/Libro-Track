/**
 * Name: Aquino, Edrel P.
 * Date: November 26, 2026
 * Title: Catalog sort helper tests
 */

import { Book } from '../models/book.model';
import { parseBookSortOption, sortBooks } from './book-sort';

const makeBook = (overrides: Partial<Book> & Pick<Book, 'title'>): Book => ({
  author: 'Anonymous',
  isbn: '0000000000',
  status: 'available',
  borrower: '',
  dueDate: null,
  ...overrides,
});

const alpha = makeBook({
  title: 'Alpha',
  author: 'Zoe Author',
  status: 'available',
  createdAt: '2026-11-20T00:00:00.000Z',
});
const beta = makeBook({
  title: 'Beta',
  author: 'Amy Author',
  status: 'overdue',
  dueDate: '2026-11-01T00:00:00.000Z',
  createdAt: '2026-11-22T00:00:00.000Z',
});
const gamma = makeBook({
  title: 'Gamma',
  author: 'Amy Author',
  status: 'borrowed',
  dueDate: '2026-11-30T00:00:00.000Z',
  createdAt: '2026-11-21T00:00:00.000Z',
});

const titles = (books: readonly Book[]): string[] => books.map((book) => book.title);

describe('sortBooks', () => {
  const books = [gamma, alpha, beta];

  it('sorts by most recently added by default', () => {
    expect(titles(sortBooks(books, 'recent'))).toEqual(['Beta', 'Gamma', 'Alpha']);
  });

  it('sorts titles in both directions', () => {
    expect(titles(sortBooks(books, 'title-asc'))).toEqual(['Alpha', 'Beta', 'Gamma']);
    expect(titles(sortBooks(books, 'title-desc'))).toEqual(['Gamma', 'Beta', 'Alpha']);
  });

  it('sorts by author and breaks ties by title', () => {
    expect(titles(sortBooks(books, 'author-asc'))).toEqual(['Beta', 'Gamma', 'Alpha']);
  });

  it('sorts by status priority', () => {
    expect(titles(sortBooks(books, 'status'))).toEqual(['Beta', 'Gamma', 'Alpha']);
  });

  it('sorts by soonest due date and keeps loans without a due date last', () => {
    expect(titles(sortBooks(books, 'due-date'))).toEqual(['Beta', 'Gamma', 'Alpha']);
  });

  it('does not mutate the source array', () => {
    const source = [...books];
    sortBooks(source, 'title-desc');

    expect(titles(source)).toEqual(['Gamma', 'Alpha', 'Beta']);
  });
});

describe('parseBookSortOption', () => {
  it('accepts known options', () => {
    expect(parseBookSortOption('due-date')).toBe('due-date');
    expect(parseBookSortOption('title-desc')).toBe('title-desc');
  });

  it('falls back to recent for missing or unknown values', () => {
    expect(parseBookSortOption(undefined)).toBe('recent');
    expect(parseBookSortOption('bogus')).toBe('recent');
  });
});
