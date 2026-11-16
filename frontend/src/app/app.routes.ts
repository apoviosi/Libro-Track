/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-16
 * Title: Application routes (book detail and CRUD form routes)
 *
 * Originally scaffolded by Aquino, Edrel P. (2026-11-12).
 */

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'books',
    loadComponent: () => import('./features/books/book-list/book-list').then((m) => m.BookList),
  },
  {
    path: 'books/new',
    loadComponent: () =>
      import('./features/books/book-form/book-form').then((m) => m.BookFormComponent),
  },
  {
    path: 'books/:id/edit',
    loadComponent: () =>
      import('./features/books/book-form/book-form').then((m) => m.BookFormComponent),
  },
  {
    path: 'books/:id',
    loadComponent: () =>
      import('./features/books/book-detail/book-detail').then((m) => m.BookDetailPlaceholder),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
