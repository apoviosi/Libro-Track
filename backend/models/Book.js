const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['available', 'borrowed', 'overdue'],
    default: 'available'
  },
  borrower: { type: String, default: '' },
  dueDate: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);