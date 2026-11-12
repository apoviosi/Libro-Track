/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-12
 * Title: Application route definitions
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
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'books',
    loadComponent: () => import('./features/books/book-list/book-list').then((m) => m.BookList),
  },
  {
    path: 'books/new',
    loadComponent: () => import('./features/books/book-form/book-form').then((m) => m.BookForm),
  },
  {
    path: 'books/:id/edit',
    loadComponent: () => import('./features/books/book-form/book-form').then((m) => m.BookForm),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
