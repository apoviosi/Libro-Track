/*
 * Name: Aquino, Edrel P.
 * Date: November 18, 2026
 * Assignment: CSAPPD1 Final Project - LibroTrack
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
import { Book } from '../../models/book.model';
import { BookService, DeleteBookResponse } from '../../services/book.service';

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
  protected readonly confirmOpen = signal(false);
  protected readonly isDeleting = signal(false);

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

  protected openDeleteDialog(): void {
    this.confirmOpen.set(true);
  }

  protected closeDeleteDialog(): void {
    if (this.isDeleting()) {
      return;
    }

    this.confirmOpen.set(false);
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
          void this.router.navigate(['/books'], { state: { feedback: response.message } });
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
