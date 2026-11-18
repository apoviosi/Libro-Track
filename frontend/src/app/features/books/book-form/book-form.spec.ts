/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-18
 * Title: Reactive book form component tests
 */

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Book } from '../../../core/models/book.model';
import { BookFormComponent } from './book-form';

interface BookFormHarness {
  form: FormGroup;
  submit(): void;
  isLoading(): boolean;
  loadFailed(): boolean;
}

const apiUrl = `${environment.apiUrl}/books`;

const existingBook: Book = {
  _id: 'book-1',
  title: 'Clean Code',
  author: 'Robert C. Martin',
  isbn: '9780132350884',
  status: 'borrowed',
  borrower: 'Jane Doe',
  dueDate: '2026-12-01T00:00:00',
};

describe('BookFormComponent', () => {
  let fixture: ComponentFixture<BookFormComponent>;
  let component: BookFormHarness;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BookFormComponent);
    component = fixture.componentInstance as unknown as BookFormHarness;
    httpMock = TestBed.inject(HttpTestingController);

    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('toggles borrower and due date validators when the status changes', () => {
    const status = component.form.controls['status'];
    const borrower = component.form.controls['borrower'];
    const dueDate = component.form.controls['dueDate'];

    component.form.patchValue({
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
    });

    expect(borrower.hasError('required')).toBe(false);
    expect(dueDate.hasError('required')).toBe(false);
    expect(component.form.valid).toBe(true);

    status.setValue('borrowed');
    expect(borrower.hasError('required')).toBe(true);
    expect(dueDate.hasError('required')).toBe(true);
    expect(component.form.valid).toBe(false);

    borrower.setValue('Jane Doe');
    dueDate.setValue('2026-12-01');
    expect(component.form.valid).toBe(true);

    status.setValue('overdue');
    expect(borrower.hasError('required')).toBe(false);
    expect(dueDate.hasError('required')).toBe(false);

    status.setValue('available');
    expect(borrower.hasError('required')).toBe(false);
    expect(dueDate.hasError('required')).toBe(false);
    expect(borrower.value).toBe('');
    expect(dueDate.value).toBe('');
    expect(component.form.valid).toBe(true);
  });

  it('rejects whitespace-only title, author, and isbn values', () => {
    component.form.patchValue({ title: '   ', author: '\t', isbn: '  ' });

    expect(component.form.controls['title'].hasError('whitespace')).toBe(true);
    expect(component.form.controls['author'].hasError('whitespace')).toBe(true);
    expect(component.form.controls['isbn'].hasError('whitespace')).toBe(true);
    expect(component.form.valid).toBe(false);
  });

  it('maps a borrowed book submit payload with trimmed strings', () => {
    component.form.patchValue({
      title: '  Clean Code  ',
      author: ' Robert C. Martin ',
      isbn: ' 9780132350884 ',
      status: 'borrowed',
      borrower: '  Jane Doe ',
      dueDate: '2026-12-01',
    });

    component.submit();

    const request = httpMock.expectOne(apiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      status: 'borrowed',
      borrower: 'Jane Doe',
      dueDate: '2026-12-01',
    });
    request.flush(existingBook);
  });

  it('clears borrower and due date for an available book submit payload', () => {
    component.form.patchValue({
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      status: 'available',
      borrower: 'Jane Doe',
      dueDate: '2026-12-01',
    });

    component.submit();

    const request = httpMock.expectOne(apiUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      status: 'available',
      borrower: '',
      dueDate: null,
    });
    request.flush(existingBook);
  });
});

describe('BookFormComponent in edit mode', () => {
  let fixture: ComponentFixture<BookFormComponent>;
  let component: BookFormHarness;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookFormComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ id: 'book-1' }) },
          } as unknown as ActivatedRoute,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BookFormComponent);
    component = fixture.componentInstance as unknown as BookFormHarness;
    httpMock = TestBed.inject(HttpTestingController);

    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads and patches the form for an existing book', () => {
    const request = httpMock.expectOne(`${apiUrl}/book-1`);
    expect(request.request.method).toBe('GET');
    request.flush(existingBook);

    expect(component.loadFailed()).toBe(false);
    expect(component.form.controls['title'].value).toBe('Clean Code');
    expect(component.form.controls['status'].value).toBe('borrowed');
    expect(component.form.controls['borrower'].value).toBe('Jane Doe');
    expect(component.form.controls['dueDate'].value).toBe('2026-12-01');
  });

  it('hides the form and blocks submit when loading the book fails', () => {
    const request = httpMock.expectOne(`${apiUrl}/book-1`);
    request.flush({ message: 'Book not found.' }, { status: 404, statusText: 'Not Found' });

    fixture.detectChanges();

    expect(component.loadFailed()).toBe(true);
    expect(component.isLoading()).toBe(false);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Book not found.',
    );

    component.submit();
    httpMock.expectNone(`${apiUrl}/book-1`);
  });
});
