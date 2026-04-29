const Book = require('../models/Book');
const User = require('../models/User');
const sendEmail = require('../utils/email');

exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json({
      status: 'success',
      results: books.length,
      data: { books }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ status: 'fail', message: 'No book found' });
    
    res.status(200).json({ status: 'success', data: { book } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const newBook = await Book.create(req.body);

    // Fetch active users to send new arrival notifications
    const activeUsers = await User.find({ active: true });
    
    // Async notification logic (does not block response)
    const newArrivalHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2 style="color: #059669;">New Arrival at RIT Library!</h2>
        <p>Hello,</p>
        <p>We are excited to announce a new addition to our library collection:</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">${newBook.title}</h3>
          <p style="margin: 5px 0 0 0;"><strong>Author:</strong> ${newBook.author}</p>
          <p style="margin: 5px 0 0 0;"><strong>Category:</strong> ${newBook.category || 'General'}</p>
        </div>
        <p>Visit the library or log into your portal to borrow or reserve it today.</p>
        <br>
        <p>Happy Reading,<br>The RIT Library Team</p>
      </div>
    `;

    activeUsers.forEach(user => {
      sendEmail({
        email: user.email,
        subject: 'New Book Arrival at RIT Library!',
        html: newArrivalHtml
      }).catch(err => console.error(`Failed to send new arrival email to ${user.email}`, err));
    });

    console.log(`Sent new arrival notifications to ${activeUsers.length} users.`);

    res.status(201).json({ status: 'success', data: { book: newBook } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!book) return res.status(404).json({ status: 'fail', message: 'No book found' });
    
    res.status(200).json({ status: 'success', data: { book } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ status: 'fail', message: 'No book found' });
    
    res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};
