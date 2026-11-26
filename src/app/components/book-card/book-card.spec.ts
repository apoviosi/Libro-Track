/**
 * Name: Aquino, Edrel P.
 * Date: November 25, 2026
 * Title: Reusable book card component tests
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Book } from '../../models/book.model';
import { BookCardComponent } from './book-card';

const borrowedBook: Book = {
  _id: 'book-1',
  title: 'Clean Code',
  author: 'Robert C. Martin',
  isbn: '9780132350884',
  status: 'borrowed',
  borrower: 'Jane Doe',
  dueDate: '2026-12-01T00:00:00',
};

const availableBook: Book = {
  _id: 'book-2',
  title: 'The Pragmatic Programmer',
  author: 'Andrew Hunt',
  isbn: '9780201616224',
  status: 'available',
  borrower: '',
  dueDate: null,
};

describe('BookCardComponent', () => {
  let fixture: ComponentFixture<BookCardComponent>;
  let component: BookCardComponent;

  const render = (book: Book, busy = false): HTMLElement => {
    fixture.componentRef.setInput('book', book);
    fixture.componentRef.setInput('busy', busy);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BookCardComponent);
    component = fixture.componentInstance;
  });

  it('renders the book details and a labelled status badge', () => {
    const element = render(borrowedBook);
    const badge = element.querySelector('.status-badge');

    expect(element.querySelector('.book-title')?.textContent).toContain('Clean Code');
    expect(element.querySelector('.book-author')?.textContent).toContain('Robert C. Martin');
    expect(badge?.textContent).toContain('Borrowed');
    expect(badge?.classList.contains('status-borrowed')).toBe(true);
  });

  it('drives the badge accent with style and class bindings per status', () => {
    const borrowedBadge = render(borrowedBook).querySelector<HTMLElement>('.status-badge');

    expect(borrowedBadge?.style.color).toContain('var(--ctp-peach)');
    expect(borrowedBadge?.style.borderColor).toContain('var(--ctp-peach)');

    fixture.componentRef.setInput('book', { ...borrowedBook, status: 'overdue' });
    fixture.detectChanges();

    const overdueBadge = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.status-badge',
    );

    expect(overdueBadge?.classList.contains('status-overdue')).toBe(true);
    expect(overdueBadge?.classList.contains('status-borrowed')).toBe(false);
    expect(overdueBadge?.style.color).toContain('var(--ctp-red)');
  });

  it('emits returnRequested with the book when Return is pressed', () => {
    const emitted: Book[] = [];
    component.returnRequested.subscribe((book: Book) => emitted.push(book));

    const element = render(borrowedBook);
    element.querySelector<HTMLButtonElement>('.btn-return')?.click();

    expect(emitted).toEqual([borrowedBook]);
  });

  it('emits deleteRequested with the book when Delete is pressed', () => {
    const emitted: Book[] = [];
    component.deleteRequested.subscribe((book: Book) => emitted.push(book));

    const element = render(availableBook);
    const deleteButton = Array.from(
      element.querySelectorAll<HTMLButtonElement>('.book-actions .btn'),
    ).find((button) => button.textContent?.trim() === 'Delete');

    deleteButton?.click();

    expect(emitted).toEqual([availableBook]);
  });

  it('blocks action output while the card is busy', () => {
    const returned: Book[] = [];
    const deleted: Book[] = [];
    component.returnRequested.subscribe((book: Book) => returned.push(book));
    component.deleteRequested.subscribe((book: Book) => deleted.push(book));

    const element = render(borrowedBook, true);
    element.querySelector<HTMLButtonElement>('.btn-return')?.click();
    Array.from(element.querySelectorAll<HTMLButtonElement>('.book-actions .btn'))
      .find((button) => button.textContent?.trim() === 'Delete')
      ?.click();

    expect(returned).toEqual([]);
    expect(deleted).toEqual([]);
  });
});
