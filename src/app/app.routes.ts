/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-18
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
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'books',
    loadComponent: () => import('./pages/book-list/book-list').then((m) => m.BookList),
  },
  {
    path: 'books/new',
    loadComponent: () => import('./pages/book-form/book-form').then((m) => m.BookForm),
  },
  {
    path: 'books/:id/edit',
    loadComponent: () => import('./pages/book-form/book-form').then((m) => m.BookForm),
  },
  {
    path: 'books/:id',
    loadComponent: () => import('./pages/book-detail/book-detail').then((m) => m.BookDetail),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
