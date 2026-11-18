/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-18
 * Title: Book detail route placeholder component
 */

import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-book-detail',
  imports: [RouterLink],
  template: `
    <section>
      <h1>Book Detail</h1>
      <p>Book ID: {{ id() ?? 'unknown' }}</p>
      <p>The full Book Detail view is delivered separately under Action Item #5.</p>
      <a routerLink="/books">Back to books</a>
    </section>
  `,
})
export class BookDetailComponent {
  readonly id = input<string>();
}
