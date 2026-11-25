/*
 * Name: Aquino, Edrel P.
 * Date: November 25, 2026
 * Assignment: CSAPPD1 Final Project - LibroTrack
 */

import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Book, BookStatus } from '../../models/book.model';
import { daysOverdue } from '../../utils/due-date';

const STATUS_LABELS: Record<BookStatus, string> = {
  available: 'Available',
  borrowed: 'Borrowed',
  overdue: 'Overdue',
};

const STATUS_ACCENTS: Record<BookStatus, string> = {
  available: 'var(--ctp-green)',
  borrowed: 'var(--ctp-peach)',
  overdue: 'var(--ctp-red)',
};

/**
 * Reusable catalog card. It renders one book and emits the circulation
 * intents; the parent screen owns the BookService calls so the card stays
 * presentational and reusable.
 */
@Component({
  selector: 'app-book-card',
  imports: [DatePipe, RouterLink],
  templateUrl: './book-card.html',
  styleUrl: './book-card.css',
})
export class BookCardComponent {
  readonly book = input.required<Book>();
  readonly busy = input(false);

  readonly returnRequested = output<Book>();
  readonly deleteRequested = output<Book>();

  protected readonly statusLabel = computed(() => STATUS_LABELS[this.book().status]);
  protected readonly statusAccent = computed(() => STATUS_ACCENTS[this.book().status]);
  protected readonly statusTint = computed(
    () => `color-mix(in srgb, ${this.statusAccent()} 14%, transparent)`,
  );
  protected readonly overdueLabel = computed(() => {
    const days = daysOverdue(this.book().dueDate) ?? 1;

    return `${days} ${days === 1 ? 'day' : 'days'} overdue`;
  });

  protected onReturn(): void {
    if (!this.busy()) {
      this.returnRequested.emit(this.book());
    }
  }

  protected onDelete(): void {
    if (!this.busy()) {
      this.deleteRequested.emit(this.book());
    }
  }
}
