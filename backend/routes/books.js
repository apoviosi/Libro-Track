const express = require('express');
const mongoose = require('mongoose');
const Book = require('../models/Book');

const router = express.Router();

const SEARCH_FIELDS = ['title', 'author', 'isbn', 'borrower'];
const STATUS_VALUES = ['available', 'borrowed', 'overdue'];
const SORT_FIELDS = ['title', 'author', 'isbn', 'status', 'borrower', 'dueDate', 'createdAt'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/books - return book records with optional search, status, and sorting
router.get('/', async (req, res) => {
  try {
    const filter = {};

    const rawSearch = req.query.search !== undefined ? req.query.search : req.query.q;
    const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';

    if (search) {
      const pattern = { $regex: escapeRegex(search), $options: 'i' };
      filter.$or = SEARCH_FIELDS.map((field) => ({ [field]: pattern }));
    }

    if (typeof req.query.status === 'string') {
      const status = req.query.status.trim().toLowerCase();

      if (status && status !== 'all') {
        if (!STATUS_VALUES.includes(status)) {
          return res.status(400).json({
            message: `Invalid status filter. Allowed values: ${STATUS_VALUES.join(', ')}`
          });
        }

        filter.status = status;
      }
    }

    const rawSort = typeof req.query.sort === 'string' ? req.query.sort.trim() : '';
    let sortField = 'createdAt';
    let sortDirection = -1;

    if (rawSort) {
      const inlineDescending = rawSort.startsWith('-');
      sortField = inlineDescending ? rawSort.slice(1).trim() : rawSort;

      if (!sortField || !SORT_FIELDS.includes(sortField)) {
        return res.status(400).json({
          message: `Invalid sort field. Allowed values: ${SORT_FIELDS.join(', ')}`
        });
      }

      sortDirection = inlineDescending ? -1 : 1;

      if (typeof req.query.order === 'string' && req.query.order.trim()) {
        const order = req.query.order.trim().toLowerCase();

        if (order !== 'asc' && order !== 'desc') {
          return res.status(400).json({
            message: "Invalid order. Allowed values: 'asc', 'desc'"
          });
        }

        sortDirection = order === 'desc' ? -1 : 1;
      }
    }

    const books = await Book.find(filter).sort({ [sortField]: sortDirection });
    res.status(200).json(books);
  } catch (error) {
    console.error('Failed to fetch books:', error.message);
    res.status(500).json({ message: 'Failed to fetch books', error: error.message });
  }
});

// GET /api/books/:id - return a single book by its MongoDB ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json(book);
  } catch (error) {
    console.error('Failed to fetch book:', error.message);
    res.status(500).json({ message: 'Failed to fetch book', error: error.message });
  }
});

// DELETE /api/books/:id - delete a book by its MongoDB ID
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.status(200).json({ message: 'Book deleted successfully', book });
  } catch (error) {
    console.error('Failed to delete book:', error.message);
    res.status(500).json({ message: 'Failed to delete book', error: error.message });
  }
});

// POST /api/books - create a new book
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const requiredFields = ['title', 'author', 'isbn'];
    const missingFields = requiredFields.filter((field) => {
      const value = body[field];
      return value === undefined || value === null || String(value).trim() === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required field(s): ${missingFields.join(', ')}`
      });
    }

    const book = new Book({
      title: body.title,
      author: body.author,
      isbn: body.isbn,
      status: body.status,
      borrower: body.borrower,
      dueDate: body.dueDate
    });

    const createdBook = await book.save();
    res.status(201).json(createdBook);
  } catch (error) {
    if (error.name === 'ValidationError' || error.code === 11000) {
      return res.status(400).json({ message: 'Invalid book data', error: error.message });
    }

    console.error('Failed to create book:', error.message);
    res.status(500).json({ message: 'Failed to create book', error: error.message });
  }
});

// PUT /api/books/:id - update an existing book by its MongoDB ID
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const body = req.body || {};
    const updatableFields = ['title', 'author', 'isbn', 'status', 'borrower', 'dueDate'];
    updatableFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        book[field] = body[field];
      }
    });

    const updatedBook = await book.save();
    res.status(200).json(updatedBook);
  } catch (error) {
    if (error.name === 'ValidationError' || error.code === 11000) {
      return res.status(400).json({ message: 'Invalid book data', error: error.message });
    }

    console.error('Failed to update book:', error.message);
    res.status(500).json({ message: 'Failed to update book', error: error.message });
  }
});

module.exports = router;
