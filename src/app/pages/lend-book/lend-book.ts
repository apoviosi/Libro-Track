/*
 * Name: Aquino, Edrel P.
 * Date: November 18, 2026
 * Assignment: CSAPPD1 Final Project - LibroTrack
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Book } from '../../models/book.model';
import { BookService } from '../../services/book.service';
import { dateInputFromToday } from '../../utils/due-date';

const nonWhitespaceValidator = (control: AbstractControl): ValidationErrors | null => {
  const value: unknown = control.value;

  if (typeof value !== 'string') {
    return null;
  }

  return value.trim().length > 0 ? null : { whitespace: true };
};

@Component({
  selector: 'app-lend-book',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './lend-book.html',
  styleUrl: './lend-book.css',
})
export class LendBook {
  private readonly bookService = inject(BookService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /** Pre-selected book, bound from the ?bookId= query parameter. */
  readonly bookId = input<string>();

  protected readonly books = signal<Book[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly isSaving = signal(false);
  protected readonly searchQuery = signal('');
  protected readonly selectedBookId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    borrower: ['', [Validators.required, nonWhitespaceValidator]],
    dueDate: [dateInputFromToday(14), Validators.required],
  });

  protected readonly availableBooks = computed(() =>
    this.books().filter((book: Book) => book.status === 'available'),
  );

  protected readonly bookMatches = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const list = this.availableBooks();

    if (!query) {
      return list;
    }

    return list.filter(
      (book: Book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.toLowerCase().includes(query),
    );
  });

  protected readonly selectedBook = computed(() => {
    const selectedId = this.selectedBookId();

    if (!selectedId) {
      return null;
    }

    return this.availableBooks().find((book: Book) => book._id === selectedId) ?? null;
  });

  constructor() {
    this.loadBooks();
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);

    const selectedId = this.selectedBookId();

    if (selectedId && !this.bookMatches().some((book: Book) => book._id === selectedId)) {
      this.selectedBookId.set(null);
    }
  }

  protected onSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedBookId.set(value || null);
  }

  protected setDueInDays(days: number): void {
    this.form.controls.dueDate.setValue(dateInputFromToday(days));
  }

  protected submit(): void {
    if (this.isLoading() || this.loadFailed() || this.isSaving()) {
      return;
    }

    this.errorMessage.set('');

    const book = this.selectedBook();

    if (!book?._id) {
      this.errorMessage.set('Select a book to lend before recording the loan.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const bookId = book._id;
    const value = this.form.getRawValue();
    const borrower = value.borrower.trim();

    this.isSaving.set(true);

    this.bookService
      .updateBook(bookId, { status: 'borrowed', borrower, dueDate: value.dueDate })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated: Book) => {
          this.isSaving.set(false);
          void this.router.navigate(['/catalog'], {
            state: { feedback: `"${updated.title}" is checked out to ${borrower}.` },
          });
        },
        error: (error: unknown) => {
          this.isSaving.set(false);
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

          const requestedId = this.bookId();

          if (
            requestedId &&
            books.some((book: Book) => book._id === requestedId && book.status === 'available')
          ) {
            this.selectedBookId.set(requestedId);
          }
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
