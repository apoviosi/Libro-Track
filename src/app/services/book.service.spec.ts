/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-18
 * Title: Book HTTP CRUD service tests
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { Book } from '../models/book.model';
import { BookPayload, DeleteBookResponse } from './book.service';
import { BookService } from './book.service';

describe('BookService', () => {
  let service: BookService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/books`;
  const book: Book = {
    _id: 'book-1',
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '9780132350884',
    status: 'borrowed',
    borrower: 'Jane Doe',
    dueDate: '2026-12-01',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(BookService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches all books', () => {
    service.getBooks().subscribe((books: Book[]) => {
      expect(books).toEqual([book]);
    });

    const request = httpMock.expectOne(apiUrl);
    expect(request.request.method).toBe('GET');
    request.flush([book]);
  });

  it('fetches a single book by id', () => {
    service.getBook('book-1').subscribe((result: Book) => {
      expect(result).toEqual(book);
    });

    const request = httpMock.expectOne(`${apiUrl}/book-1`);
    expect(request.request.method).toBe('GET');
    request.flush(book);
  });

  it('creates a book', () => {
    const payload: BookPayload = {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      status: 'borrowed',
      borrower: 'Jane Doe',
      dueDate: '2026-12-01',
    };

    service.createBook(payload).subscribe((result: Book) => {
      expect(result).toEqual(book);
    });

    const request = httpMock.expectOne(apiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(book);
  });

  it('updates a book', () => {
    const changes: Partial<BookPayload> = { status: 'available', borrower: '', dueDate: null };

    service.updateBook('book-1', changes).subscribe((result: Book) => {
      expect(result).toEqual(book);
    });

    const request = httpMock.expectOne(`${apiUrl}/book-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(changes);
    request.flush(book);
  });

  it('deletes a book', () => {
    const response: DeleteBookResponse = { message: 'Book deleted.', book };

    service.deleteBook('book-1').subscribe((result: DeleteBookResponse) => {
      expect(result).toEqual(response);
    });

    const request = httpMock.expectOne(`${apiUrl}/book-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(response);
  });
});
