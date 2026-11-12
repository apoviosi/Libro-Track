/*
 * Name: Aquino, Edrel P.
 * Date: November 12, 2026
 * Assignment: CSAPPD1 Final Project - LibroTrack
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
    loadComponent: () => import('./features/books/book-form/book-form').then((m) => m.BookForm),
  },
  {
    path: 'books/:id/edit',
    loadComponent: () => import('./features/books/book-form/book-form').then((m) => m.BookForm),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
