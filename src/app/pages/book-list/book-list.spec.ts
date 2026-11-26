/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-26
 * Title: Book catalog list overdue rendering tests
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Book } from '../../models/book.model';
import { dateInputFromToday } from '../../utils/due-date';
import { BookList } from './book-list';

const apiUrl = `${environment.apiUrl}/books`;

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  _id: 'book-1',
  title: 'Clean Code',
  author: 'Robert C. Martin',
  isbn: '9780132350884',
  status: 'borrowed',
  borrower: 'Jane Doe',
  dueDate: '2026-12-01',
  ...overrides,
});

describe('BookList overdue rendering', () => {
  let fixture: ComponentFixture<BookList>;
  let httpMock: HttpTestingController;

  const renderBooks = (books: Book[]): void => {
    fixture = TestBed.createComponent(BookList);

    const request = httpMock.expectOne(apiUrl);
    expect(request.request.method).toBe('GET');
    request.flush(books);

    fixture.detectChanges();
  };

  const badge = (): HTMLElement =>
    fixture.nativeElement.querySelector('.status-badge') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('does not mark a book due today as overdue', () => {
    renderBooks([makeBook({ dueDate: dateInputFromToday(0) })]);

    expect(badge().textContent?.trim().toLowerCase()).toBe('borrowed');
    expect(badge().classList.contains('status-borrowed')).toBe(true);
    expect(badge().classList.contains('status-overdue')).toBe(false);
    expect(fixture.nativeElement.querySelector('.overdue-note')).toBeNull();
    expect(fixture.nativeElement.querySelector('.due-overdue')).toBeNull();
  });

  it('renders a borrowed book past its due date as overdue with the accurate day count', () => {
    renderBooks([makeBook({ dueDate: dateInputFromToday(-3) })]);

    expect(badge().textContent?.trim().toLowerCase()).toBe('overdue');
    expect(badge().classList.contains('status-overdue')).toBe(true);
    expect(badge().classList.contains('status-borrowed')).toBe(false);

    const note = fixture.nativeElement.querySelector('.overdue-note') as HTMLElement;
    expect(note.textContent?.trim()).toBe('3 days overdue');
    expect(fixture.nativeElement.querySelector('.due-overdue')).not.toBeNull();
  });

  it('groups a stale borrowed book under the effective overdue counts and filter', () => {
    renderBooks([makeBook({ dueDate: dateInputFromToday(-2) })]);

    const overdueCount = fixture.nativeElement.querySelector(
      '.pill-overdue .pill-count',
    ) as HTMLElement;
    const borrowedCount = fixture.nativeElement.querySelector(
      '.pill-borrowed .pill-count',
    ) as HTMLElement;

    expect(overdueCount.textContent?.trim()).toBe('1');
    expect(borrowedCount.textContent?.trim()).toBe('0');

    fixture.componentRef.setInput('status', 'overdue');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.book-card')).not.toBeNull();
  });
});
