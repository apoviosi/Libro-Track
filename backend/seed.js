const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const mongoose = require('mongoose');
const Book = require('./models/Book');

const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const books = [
  {
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt and David Thomas',
    isbn: '978-0201616224',
    status: 'available',
    borrower: '',
    dueDate: null
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    status: 'borrowed',
    borrower: 'Maria Santos',
    dueDate: daysFromNow(7)
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    isbn: '978-0547928227',
    status: 'available',
    borrower: '',
    dueDate: null
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '978-0451524935',
    status: 'overdue',
    borrower: 'James Cruz',
    dueDate: daysFromNow(-5)
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    status: 'available',
    borrower: '',
    dueDate: null
  },
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0743273565',
    status: 'borrowed',
    borrower: 'Ana Reyes',
    dueDate: daysFromNow(14)
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0061120084',
    status: 'available',
    borrower: '',
    dueDate: null
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '978-0735211292',
    status: 'overdue',
    borrower: 'Liam Mendoza',
    dueDate: daysFromNow(-12)
  },
  {
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    isbn: '978-0062315007',
    status: 'available',
    borrower: '',
    dueDate: null
  },
  {
    title: 'Dune',
    author: 'Frank Herbert',
    isbn: '978-0441172719',
    status: 'borrowed',
    borrower: 'Sofia Garcia',
    dueDate: daysFromNow(3)
  },
  {
    title: 'The Catcher in the Rye',
    author: 'J.D. Salinger',
    isbn: '978-0316769488',
    status: 'available',
    borrower: '',
    dueDate: null
  },
  {
    title: 'Thinking, Fast and Slow',
    author: 'Daniel Kahneman',
    isbn: '978-0374533557',
    status: 'overdue',
    borrower: 'Noah Villanueva',
    dueDate: daysFromNow(-20)
  }
];

const seedBooks = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined. Please check your .env file.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    const { deletedCount } = await Book.deleteMany({});
    console.log(`Cleared ${deletedCount} existing book record(s)`);

    const inserted = await Book.insertMany(books);
    console.log(`Successfully seeded ${inserted.length} book records`);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(process.exitCode || 0);
  }
};

if (require.main === module) {
  seedBooks();
}

module.exports = { books, seedBooks };
