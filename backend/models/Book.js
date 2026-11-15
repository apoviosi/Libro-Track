const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true, trim: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['available', 'borrowed', 'overdue'],
    default: 'available'
  },
  borrower: { type: String, default: '' },
  dueDate: { type: Date, default: null }
}, { timestamps: true });

// Cross-field validation: a borrowed book must have a borrower and a due date
bookSchema.pre('validate', function() {
  if (this.status === 'borrowed') {
    const borrower = typeof this.borrower === 'string' ? this.borrower.trim() : '';

    if (!borrower) {
      this.invalidate('borrower', 'Borrower name is required when the book status is borrowed');
    }

    if (!this.dueDate) {
      this.invalidate('dueDate', 'Due date is required when the book status is borrowed');
    } else {
      const dueDate = this.dueDate instanceof Date ? this.dueDate : new Date(this.dueDate);

      if (Number.isNaN(dueDate.getTime())) {
        this.invalidate('dueDate', 'Due date must be a valid date when the book status is borrowed');
      }
    }
  }
});

module.exports = mongoose.model('Book', bookSchema);