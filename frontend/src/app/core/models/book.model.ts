/**
 * Name: Deelan Glear R. David
 * Date: 2026-11-12
 * Title: Book model interfaces
 */

export type BookStatus = 'available' | 'borrowed' | 'overdue';

export interface Book {
  _id?: string;
  title: string;
  author: string;
  isbn: string;
  status: BookStatus;
  borrower: string;
  dueDate: string | null;
  createdAt?: string;
  updatedAt?: string;
}
