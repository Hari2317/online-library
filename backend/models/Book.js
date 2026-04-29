const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A book must have a title'],
    trim: true,
  },
  author: {
    type: String,
    required: [true, 'A book must have an author'],
    trim: true,
  },
  isbn: {
    type: String,
    required: [true, 'A book must have an ISBN'],
    unique: true,
  },
  publishedYear: Number,
  category: String,
  borrowPeriodDays: {
    type: Number,
    default: 180,
  },
  totalCopies: {
    type: Number,
    required: [true, 'Total copies must be specified'],
    default: 1,
  },
  availableCopies: {
    type: Number,
    required: [true, 'Available copies must be specified'],
    default: 1,
  },
  description: String,
  coverImage: String, // URL to an image
}, { timestamps: true });

// Prevent availableCopies from exceeding totalCopies
bookSchema.pre('save', function() {
  // on creation, default available copies to total copies if not set
  if (this.isNew && this.availableCopies === undefined) {
    this.availableCopies = this.totalCopies;
  }
});

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;
