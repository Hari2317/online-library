const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Transaction must belong to a user'],
  },
  userName: {
    type: String,
  },
  book: {
    type: mongoose.Schema.ObjectId,
    ref: 'Book',
    required: [true, 'Transaction must belong to a book'],
  },
  bookName: {
    type: String,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
  },
  returnDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['borrowed', 'reserved', 'returned', 'overdue'],
    default: 'borrowed',
  },
  fineAmount: {
    type: Number,
    default: 0,
  },
  finePaid: {
    type: Boolean,
    default: false,
  },
  paymentProof: {
    type: String,
  },
  paymentStatus: {
    type: String,
    enum: ['pending_verification', 'verified', 'rejected'],
    default: null
  }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
