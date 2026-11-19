/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-19
 * Title: Reactive dashboard summary counts
 */

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
import { Book } from '../../models/book.model';
import { BookService } from '../../services/book.service';
import { getDaysOverdue, getEffectiveStatus, getSummaryCounts } from '../../utils/book-status';
import { daysUntilDue } from '../../utils/due-date';

interface DueEntry {
  book: Book;
  days: number;
}

@Component({
  selector: 'app-home',
  imports: [DatePipe, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly bookService = inject(BookService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly books = signal<Book[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly isProcessingId = signal<string | null>(null);

  protected readonly counts = computed(() => getSummaryCounts(this.books()));

  protected readonly dueWatch = computed<{ overdue: DueEntry[]; dueSoon: DueEntry[] }>(() => {
    const overdue: DueEntry[] = [];
    const dueSoon: DueEntry[] = [];
    const now = new Date();

    for (const book of this.books()) {
      const status = getEffectiveStatus(book, now);

      if (status === 'overdue') {
        overdue.push({ book, days: Math.max(1, getDaysOverdue(book.dueDate, now)) });
      } else if (status === 'borrowed') {
        const days = daysUntilDue(book.dueDate);

        if (days !== null && days <= 7) {
          dueSoon.push({ book, days });
        }
      }
    }

    const byDueDate = (a: DueEntry, b: DueEntry): number =>
      (a.book.dueDate ?? '').localeCompare(b.book.dueDate ?? '');

    return {
      overdue: overdue.sort(byDueDate),
      dueSoon: dueSoon.sort(byDueDate),
    };
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

  protected markReturned(book: Book): void {
    if (!book?._id || this.isProcessingId() === book._id) {
      return;
    }

    const bookId = book._id;

    this.isProcessingId.set(bookId);

    this.bookService
      .updateBook(bookId, { status: 'available', borrower: '', dueDate: null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated: Book) => {
          this.isProcessingId.set(null);
          this.books.update((current: Book[]) =>
            current.map((entry: Book) => (entry._id === updated._id ? updated : entry)),
          );
          this.successMessage.set(`"${updated.title}" is back on the shelf.`);
        },
        error: (error: unknown) => {
          this.isProcessingId.set(null);
          this.errorMessage.set(this.describeError(error));
        },
      });
  }

  private loadBooks(): void {
    this.isLoading.set(true);
    this.loadFailed.set(false);
    this.errorMessage.set('');

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
