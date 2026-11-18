/*
 * Name: Aquino, Edrel P.
 * Date: November 18, 2026
 * Assignment: CSAPPD1 Final Project - LibroTrack
 */

/*
 * Reactive form logic originally implemented by Deelan Glear R. David (2026-11-18).
 * Catppuccin Mocha restyling and instant save feedback by Aquino, Edrel P.
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Book, BookStatus } from '../../models/book.model';
import { BookPayload, BookService } from '../../services/book.service';

const nonWhitespaceValidator = (control: AbstractControl): ValidationErrors | null => {
  const value: unknown = control.value;

  if (typeof value !== 'string') {
    return null;
  }

  return value.trim().length > 0 ? null : { whitespace: true };
};

@Component({
  selector: 'app-book-form',
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './book-form.css',
  templateUrl: './book-form.html',
})
export class BookForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly bookService = inject(BookService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statusOptions: ReadonlyArray<{ value: BookStatus; label: string }> = [
    { value: 'available', label: 'Available' },
    { value: 'borrowed', label: 'Borrowed' },
    { value: 'overdue', label: 'Overdue' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, nonWhitespaceValidator]],
    author: ['', [Validators.required, nonWhitespaceValidator]],
    isbn: ['', [Validators.required, nonWhitespaceValidator]],
    status: this.fb.nonNullable.control<BookStatus>('available', Validators.required),
    borrower: [''],
    dueDate: [''],
  });

  protected readonly status = signal<BookStatus>(this.form.controls.status.value);
  protected readonly bookId = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly isEditMode = computed(() => this.bookId() !== null);

  constructor() {
    this.form.controls.status.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status: BookStatus) => {
        this.status.set(status);
        this.applyLoanValidators(status);
      });

    this.applyLoanValidators(this.form.controls.status.value);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.bookId.set(id);
    this.isLoading.set(true);

    this.bookService
      .getBook(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (book: Book) => {
          this.form.patchValue({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            status: book.status,
            borrower: book.borrower ?? '',
            dueDate: this.toDateInputValue(book.dueDate),
          });
          this.loadFailed.set(false);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.loadFailed.set(true);
          this.errorMessage.set(this.describeError(error));
        },
      });
  }

  protected submit(): void {
    if (this.isLoading() || this.loadFailed()) {
      return;
    }

    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.bookId();
    const value = this.form.getRawValue();
    const isAvailable = value.status === 'available';
    const payload: BookPayload = {
      title: value.title.trim(),
      author: value.author.trim(),
      isbn: value.isbn.trim(),
      status: value.status,
      borrower: isAvailable ? '' : value.borrower.trim(),
      dueDate: isAvailable ? null : value.dueDate || null,
    };

    this.isSaving.set(true);

    const request$ = id
      ? this.bookService.updateBook(id, payload)
      : this.bookService.createBook(payload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSaving.set(false);
        const feedback = this.isEditMode()
          ? 'Book updated successfully.'
          : 'Book saved successfully.';
        void this.router.navigate(['/catalog'], { state: { feedback } });
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.errorMessage.set(this.describeError(error));
      },
    });
  }

  private applyLoanValidators(status: BookStatus): void {
    const borrower = this.form.controls.borrower;
    const dueDate = this.form.controls.dueDate;

    if (status === 'available') {
      this.form.patchValue({ borrower: '', dueDate: '' }, { emitEvent: false });
      borrower.setValidators(null);
      dueDate.setValidators(null);
    } else {
      borrower.setValidators(Validators.required);
      dueDate.setValidators(Validators.required);
    }

    borrower.updateValueAndValidity({ emitEvent: false });
    dueDate.updateValueAndValidity({ emitEvent: false });
  }

  private toDateInputValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string } | null;
      return body?.message ?? error.message ?? 'The request could not be completed.';
    }

    return 'An unexpected error occurred.';
  }
}
