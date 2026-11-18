/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-18
 * Title: Book HTTP CRUD service
 */

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Book } from '../models/book.model';

export type BookPayload = Omit<Book, '_id' | 'createdAt' | 'updatedAt'>;

export interface DeleteBookResponse {
  message: string;
  book: Book;
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/books`;

  getBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl);
  }

  getBook(id: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`);
  }

  createBook(book: BookPayload): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, book);
  }

  updateBook(id: string, book: Partial<BookPayload>): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/${id}`, book);
  }

  deleteBook(id: string): Observable<DeleteBookResponse> {
    return this.http.delete<DeleteBookResponse>(`${this.apiUrl}/${id}`);
  }
}
