/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-16
 * Title: Reactive create/edit book form component
 */

import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Book, BookStatus } from '../../../core/models/book.model';
import { BookPayload, BookService } from '../../../core/services/book.service';

@Component({
  selector: 'app-book-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './book-form.html',
})
export class BookFormComponent implements OnInit {
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
    title: ['', Validators.required],
    author: ['', Validators.required],
    isbn: ['', Validators.required],
    status: this.fb.nonNullable.control<BookStatus>('available', Validators.required),
    borrower: [''],
    dueDate: [''],
  });

  protected readonly status = toSignal(this.form.controls.status.valueChanges, {
    initialValue: this.form.controls.status.value,
  });

  protected readonly bookId = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');
  protected readonly isEditMode = computed(() => this.bookId() !== null);

  constructor() {
    this.form.controls.status.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => this.applyLoanValidators(status));

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
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorMessage.set(this.describeError(error));
        },
      });
  }

  protected submit(): void {
    this.errorMessage.set('');
    this.successMessage.set('');

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
        this.successMessage.set(id ? 'Book updated successfully.' : 'Book created successfully.');
        void this.router.navigate(['/books']);
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

    return date.toISOString().slice(0, 10);
  }

  private describeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: string } | null;
      return body?.message ?? error.message ?? 'The request could not be completed.';
    }

    return 'An unexpected error occurred.';
  }
}
