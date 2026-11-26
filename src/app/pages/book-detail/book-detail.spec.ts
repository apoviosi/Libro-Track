/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-26
 * Title: Book detail overdue rendering tests
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Book } from '../../models/book.model';
import { dateInputFromToday } from '../../utils/due-date';
import { BookDetail } from './book-detail';

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

describe('BookDetail overdue rendering', () => {
  let fixture: ComponentFixture<BookDetail>;
  let httpMock: HttpTestingController;

  const renderBook = async (book: Book): Promise<void> => {
    fixture = TestBed.createComponent(BookDetail);
    fixture.componentRef.setInput('id', book._id);

    fixture.detectChanges();
    await fixture.whenStable();

    const request = httpMock.expectOne(`${apiUrl}/${book._id}`);
    expect(request.request.method).toBe('GET');
    request.flush(book);

    fixture.detectChanges();
  };

  const badge = (): HTMLElement =>
    fixture.nativeElement.querySelector('.status-badge') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookDetail],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('does not mark a book due today as overdue', async () => {
    await renderBook(makeBook({ dueDate: dateInputFromToday(0) }));

    expect(badge().textContent?.trim().toLowerCase()).toBe('borrowed');
    expect(badge().classList.contains('status-borrowed')).toBe(true);
    expect(badge().classList.contains('status-overdue')).toBe(false);
    expect(fixture.nativeElement.querySelector('.overdue-note')).toBeNull();
    expect(fixture.nativeElement.querySelector('.due-overdue')).toBeNull();
  });

  it('renders a borrowed book past its due date as overdue with the accurate day count', async () => {
    await renderBook(makeBook({ dueDate: dateInputFromToday(-2) }));

    expect(badge().textContent?.trim().toLowerCase()).toBe('overdue');
    expect(badge().classList.contains('status-overdue')).toBe(true);
    expect(badge().classList.contains('status-borrowed')).toBe(false);

    const note = fixture.nativeElement.querySelector('.overdue-note') as HTMLElement;
    expect(note.textContent?.trim()).toBe('2 days overdue');
    expect(fixture.nativeElement.querySelector('.due-overdue')).not.toBeNull();
  });
});
