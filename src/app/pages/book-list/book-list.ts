/*
 * Name: Aquino, Edrel P.
 * Date: November 18, 2026
 * Assignment: CSAPPD1 Final Project - LibroTrack
 */

import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import { Book } from '../../models/book.model';
import { BookService, DeleteBookResponse } from '../../services/book.service';

@Component({
  selector: 'app-book-list',
  imports: [ConfirmDialogComponent, DatePipe, RouterLink],
  templateUrl: './book-list.html',
  styleUrl: './book-list.css',
})
export class BookList {
  private readonly bookService = inject(BookService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly books = signal<Book[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly bookToDelete = signal<Book | null>(null);
  protected readonly isDeleting = signal(false);

  protected readonly deletePrompt = computed(() => {
    const book = this.bookToDelete();

    if (!book) {
      return '';
    }

    return `Delete "${book.title}" by ${book.author}? This action cannot be undone.`;
  });

  constructor() {
    this.loadBooks();
  }

  protected retryLoad(): void {
    this.loadBooks();
  }

  protected dismissFeedback(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  protected requestDelete(book: Book): void {
    if (this.isDeleting()) {
      return;
    }

    this.dismissFeedback();
    this.bookToDelete.set(book);
  }

  protected cancelDelete(): void {
    if (this.isDeleting()) {
      return;
    }

    this.bookToDelete.set(null);
  }

  protected confirmDelete(): void {
    const book = this.bookToDelete();

    if (!book?._id || this.isDeleting()) {
      return;
    }

    const deletedId = book._id;

    this.isDeleting.set(true);

    this.bookService
      .deleteBook(deletedId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: DeleteBookResponse) => {
          this.isDeleting.set(false);
          this.bookToDelete.set(null);
          this.books.update((current: Book[]) =>
            current.filter((entry: Book) => entry._id !== deletedId),
          );
          this.successMessage.set(response.message);
        },
        error: (error: unknown) => {
          this.isDeleting.set(false);
          this.errorMessage.set(this.describeError(error));
        },
      });
  }

  private loadBooks(): void {
    this.isLoading.set(true);
    this.loadFailed.set(false);

    this.bookService
      .getBooks()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (books: Book[]) => {
          this.books.set(books);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.loadFailed.set(true);
          this.errorMessage.set(this.describeError(error));
        },
      });
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string } | null;
      return body?.message ?? error.message ?? 'The request could not be completed.';
    }

    return 'An unexpected error occurred.';
  }
}
