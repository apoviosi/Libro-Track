/*
 * Name: Aquino, Edrel P.
 * Date: November 18, 2026
 * Assignment: CSAPPD1 Final Project - LibroTrack
 */

/*
 * Route configuration originally maintained by Deelan Glear R. David (2026-11-18).
 * Catalog, lend, and books redirect routes added by Aquino, Edrel P.
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
    path: 'catalog',
    loadComponent: () => import('./pages/book-list/book-list').then((m) => m.BookList),
  },
  {
    path: 'lend',
    loadComponent: () => import('./pages/lend-book/lend-book').then((m) => m.LendBook),
  },
  {
    path: 'books',
    redirectTo: 'catalog',
    pathMatch: 'full',
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
