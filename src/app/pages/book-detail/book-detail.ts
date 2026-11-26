/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-26
 * Title: Book detail page
 */

import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';
import { Book, BookStatus } from '../../models/book.model';
import { BookService, DeleteBookResponse } from '../../services/book.service';
import { getDaysOverdue, getEffectiveStatus } from '../../utils/book-status';

@Component({
  selector: 'app-book-detail',
  imports: [ConfirmDialogComponent, DatePipe, RouterLink],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.css',
})
export class BookDetail {
  private readonly bookService = inject(BookService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input.required<string>();

  protected readonly book = signal<Book | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly confirmOpen = signal(false);
  protected readonly isDeleting = signal(false);
  protected readonly isProcessing = signal(false);

  protected readonly deletePrompt = computed(() => {
    const book = this.book();

    if (!book) {
      return '';
    }

    return `Delete "${book.title}" by ${book.author}? This action cannot be undone.`;
  });

  constructor() {
    effect(() => {
      const bookId = this.id();
      untracked(() => this.loadBook(bookId));
    });
  }

  protected effectiveStatus(book: Book): BookStatus {
    return getEffectiveStatus(book);
  }

  protected overdueLabel(book: Book): string {
    const days = Math.max(1, getDaysOverdue(book.dueDate));

    return `${days} ${days === 1 ? 'day' : 'days'} overdue`;
  }

  protected openDeleteDialog(): void {
    if (this.isDeleting() || this.isProcessing()) {
      return;
    }

    this.confirmOpen.set(true);
  }

  protected closeDeleteDialog(): void {
    if (this.isDeleting()) {
      return;
    }

    this.confirmOpen.set(false);
  }

  protected markReturned(): void {
    const book = this.book();

    if (!book?._id || this.isProcessing() || this.isDeleting()) {
      return;
    }

    const bookId = book._id;

    this.isProcessing.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    this.bookService
      .updateBook(bookId, { status: 'available', borrower: '', dueDate: null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated: Book) => {
          this.isProcessing.set(false);
          this.book.set(updated);
          this.successMessage.set(`"${updated.title}" is back on the shelf.`);
        },
        error: (error: unknown) => {
          this.isProcessing.set(false);
          this.errorMessage.set(this.describeError(error));
        },
      });
  }

  protected confirmDelete(): void {
    const book = this.book();

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
          void this.router.navigate(['/catalog'], {
            state: { feedback: response.message },
          });
        },
        error: (error: unknown) => {
          this.isDeleting.set(false);
          this.confirmOpen.set(false);
          this.errorMessage.set(this.describeError(error));
        },
      });
  }

  private loadBook(bookId: string): void {
    this.isLoading.set(true);
    this.loadFailed.set(false);
    this.errorMessage.set('');

    this.bookService
      .getBook(bookId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (book: Book) => {
          this.book.set(book);
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
