/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-26
 * Title: Book catalog list page
 */

import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import { Book, BookStatus } from '../../models/book.model';
import { BookService, DeleteBookResponse } from '../../services/book.service';
import { getDaysOverdue, getEffectiveStatus } from '../../utils/book-status';

type StatusFilter = 'all' | BookStatus;

const isBookStatus = (value: string | undefined): value is BookStatus =>
  value === 'available' || value === 'borrowed' || value === 'overdue';

@Component({
  selector: 'app-book-list',
  imports: [ConfirmDialogComponent, DatePipe, RouterLink],
  templateUrl: './book-list.html',
  styleUrl: './book-list.css',
})
export class BookList {
  private readonly bookService = inject(BookService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  /** Active status filter, bound from the ?status= query parameter. */
  readonly status = input<string>();

  protected readonly books = signal<Book[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly successMessage = signal('');
  protected readonly errorMessage = signal('');
  protected readonly searchQuery = signal('');
  protected readonly bookToDelete = signal<Book | null>(null);
  protected readonly isDeleting = signal(false);
  protected readonly isProcessingId = signal<string | null>(null);

  protected readonly activeStatus = computed<StatusFilter>(() => {
    const status = this.status();

    return isBookStatus(status) ? status : 'all';
  });

  protected readonly statusCounts = computed<Record<StatusFilter, number>>(() => {
    const list = this.books();
    const counts: Record<StatusFilter, number> = {
      all: list.length,
      available: 0,
      borrowed: 0,
      overdue: 0,
    };

    for (const book of list) {
      counts[getEffectiveStatus(book)] += 1;
    }

    return counts;
  });

  protected readonly filteredBooks = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.activeStatus();

    return this.books().filter((book: Book) => {
      if (status !== 'all' && getEffectiveStatus(book) !== status) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.toLowerCase().includes(query)
      );
    });
  });

  protected readonly hasAnyBooks = computed(() => this.books().length > 0);

  protected readonly deletePrompt = computed(() => {
    const book = this.bookToDelete();

    if (!book) {
      return '';
    }

    return `Delete "${book.title}" by ${book.author}? This action cannot be undone.`;
  });

  constructor() {
    this.successMessage.set(this.readNavigationFeedback());
    this.loadBooks();
  }

  protected onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  protected onStatusFilter(next: StatusFilter): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: next === 'all' ? { status: null } : { status: next },
    });
  }

  protected clearFilters(): void {
    this.searchQuery.set('');

    if (this.activeStatus() !== 'all') {
      this.onStatusFilter('all');
    }
  }

  protected retryLoad(): void {
    this.loadBooks();
  }

  protected dismissFeedback(): void {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  protected effectiveStatus(book: Book): BookStatus {
    return getEffectiveStatus(book);
  }

  protected overdueLabel(book: Book): string {
    const days = Math.max(1, getDaysOverdue(book.dueDate));

    return `${days} ${days === 1 ? 'day' : 'days'} overdue`;
  }

  protected returnBook(book: Book): void {
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

  protected requestDelete(book: Book): void {
    if (this.isDeleting() || this.isProcessingId() !== null) {
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

  private readNavigationFeedback(): string {
    const feedback: unknown = this.router.getCurrentNavigation()?.extras?.state?.['feedback'];

    return typeof feedback === 'string' ? feedback : '';
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string } | null;
      return body?.message ?? error.message ?? 'The request could not be completed.';
    }

    return 'An unexpected error occurred.';
  }
}
