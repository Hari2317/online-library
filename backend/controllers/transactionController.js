const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const sendEmail = require('../utils/email');

exports.borrowBook = async (req, res) => {
  try {
    const { bookId, dueDate: customDueDate } = req.body;
    const book = await Book.findById(bookId);

    if (!book) return res.status(404).json({ status: 'fail', message: 'Book not found' });
    if (book.availableCopies < 1) return res.status(400).json({ status: 'fail', message: 'No available copies' });

    // Decrease available copies
    book.availableCopies -= 1;
    await book.save();

    // Create transaction (Due date custom or book-specific duration)
    let dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (book.borrowPeriodDays || 180));
    
    if (customDueDate) {
      dueDate = new Date(customDueDate);
    }

    const newTransaction = await Transaction.create({
      user: req.user._id,
      userName: req.user.name,
      book: bookId,
      bookName: book.title,
      dueDate
    });

    // Send borrow confirmation email
    const borrowHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #2563eb;">Enjoy Your Book!</h2>
        <p>Hello <strong>${req.user.name}</strong>,</p>
        <p>This email is to confirm that you have successfully borrowed the following book from the RIT Library:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 0;"><strong>Book Title:</strong> ${book.title}</p>
          <p style="margin: 5px 0 0 0;"><strong>Borrowed Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p style="margin: 5px 0 0 0; color: #d97706;"><strong>Due Date:</strong> ${dueDate.toLocaleDateString()}</p>
        </div>
        <p>Please ensure the book is returned on or before the due date to avoid any late fines. Happy reading!</p>
        <br>
        <p>Best regards,<br>The RIT Library Team</p>
      </div>
    `;

    sendEmail({
      email: req.user.email,
      subject: 'Confirmation: You Have Borrowed a Book',
      html: borrowHtml
    });

    res.status(201).json({ status: 'success', data: { transaction: newTransaction } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.reserveBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const book = await Book.findById(bookId);

    if (!book) return res.status(404).json({ status: 'fail', message: 'Book not found' });
    if (book.availableCopies > 0) {
      return res.status(400).json({ status: 'fail', message: 'Book is available to borrow directly. No need to reserve.' });
    }

    const existingReservation = await Transaction.findOne({
      user: req.user._id,
      book: bookId,
      status: 'reserved'
    });

    if (existingReservation) {
      return res.status(400).json({ status: 'fail', message: 'You have already reserved this book' });
    }

    // Creating reservation transaction. Due date is placeholder for reservations.
    const newReservation = await Transaction.create({
      user: req.user._id,
      userName: req.user.name,
      book: bookId,
      bookName: book.title,
      dueDate: new Date(Date.now() + 86400000), 
      status: 'reserved'
    });

    res.status(201).json({ status: 'success', data: { transaction: newReservation } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { transactionId, returnDate: customReturnDate } = req.body;
    const transaction = await Transaction.findById(transactionId).populate('user', 'name email');

    if (!transaction) return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
    if (transaction.status === 'returned') return res.status(400).json({ status: 'fail', message: 'Book already returned' });

    // Determine exact return date 
    const finalReturnDate = customReturnDate ? new Date(customReturnDate) : new Date();
    transaction.returnDate = finalReturnDate;
    
    // Calculate and lock in final fine upon return
    if (finalReturnDate > transaction.dueDate) {
        const diffTime = Math.abs(finalReturnDate - transaction.dueDate);
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        transaction.fineAmount = daysOverdue * 1;
        transaction.finePaid = false;
    } else {
        transaction.fineAmount = 0;
        transaction.finePaid = true;
    }

    // Set return status
    transaction.status = 'returned';
    await transaction.save();

    // Increase available copies
    const book = await Book.findById(transaction.book);
    book.availableCopies += 1;
    await book.save();

    // Check for reservations and notify
    if (book.availableCopies > 0) {
      const oldestReservation = await Transaction.findOne({
        book: book._id,
        status: 'reserved'
      }).sort({ createdAt: 1 }).populate('user', 'name email');

      if (oldestReservation && oldestReservation.user && oldestReservation.user.email) {
        const reserveAlertHtml = `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
            <h2 style="color: #4f46e5;">Your Reserved Book is Available!</h2>
            <p>Hello <strong>${oldestReservation.user.name || oldestReservation.userName}</strong>,</p>
            <p>Good news! The book you reserved, <strong>${book.title}</strong>, is now available to borrow.</p>
            <p>Please visit the library soon to borrow it.</p>
            <br>
            <p>Best regards,<br>The RIT Library Team</p>
          </div>
        `;
        // Send email without blocking
        sendEmail({
          email: oldestReservation.user.email,
          subject: 'Library Alert: Reserved Book Available',
          html: reserveAlertHtml
        }).catch(err => console.error('Failed to send reservation alert:', err));
        console.log(`Reservation alert triggered for ${oldestReservation.user.email} (Book: ${book.title})`);
      }
    }

    // Send return confirmation email
    const userName = transaction.user && transaction.user.name ? transaction.user.name : transaction.userName;
    const userEmail = transaction.user && transaction.user.email ? transaction.user.email : null;

    if (userEmail) {
      const returnHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #16a34a;">Return Confirmed</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Thank you for returning your borrowed book to the RIT Library. Here are the details of your return:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p style="margin: 0;"><strong>Book Title:</strong> ${transaction.bookName || book.title}</p>
            <p style="margin: 5px 0 0 0;"><strong>Returned Date:</strong> ${finalReturnDate.toLocaleDateString()}</p>
            <p style="margin: 5px 0 0 0;"><strong>Late Fine (if any):</strong> ₹${transaction.fineAmount}</p>
          </div>
          <p>We hope you enjoyed the book! Feel free to browse our catalog for your next great read.</p>
          <br>
          <p>Best regards,<br>The RIT Library Team</p>
        </div>
      `;

      sendEmail({
        email: userEmail,
        subject: 'Thank You: Book Return Confirmation',
        html: returnHtml
      });
    }

    res.status(200).json({ status: 'success', data: { transaction } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.getMyHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).populate('book', 'title author coverImage');
    res.status(200).json({ status: 'success', results: transactions.length, data: { transactions } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const now = new Date();
    // Update overdue statuses and calculate fines before fetching all
    const activeTransactions = await Transaction.find({ status: { $in: ['borrowed', 'overdue'] }, returnDate: null });
    
    for (const txn of activeTransactions) {
      if (now > txn.dueDate) {
        const diffTime = Math.abs(now - txn.dueDate);
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const fine = daysOverdue * 1; // $1 per day overdue

        if (txn.status !== 'overdue' || txn.fineAmount !== fine) {
          txn.status = 'overdue';
          txn.fineAmount = fine;
          txn.finePaid = false; 
          await txn.save();
        }
      }
    }

    const transactions = await Transaction.find().populate('user', 'name email').populate('book', 'title author');
    res.status(200).json({ status: 'success', results: transactions.length, data: { transactions } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.payFine = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
    
    transaction.finePaid = true;
    transaction.paymentStatus = 'verified';
    transaction.fineAmount = 0;

    // Provide a 1-day grace period, extending the due date so the fine doesn't instantly reappear
    if (!transaction.returnDate) {
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 1);
      transaction.dueDate = newDueDate;
      transaction.status = 'borrowed';
    }
    
    await transaction.save();
    res.status(200).json({ status: 'success', data: { transaction } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.submitPayment = async (req, res) => {
  try {
    const { paymentProof } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) return res.status(404).json({ status: 'fail', message: 'Transaction not found' });
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    transaction.paymentProof = paymentProof;
    transaction.paymentStatus = 'pending_verification';
    await transaction.save();

    res.status(200).json({ status: 'success', data: { transaction } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

