const express = require('express');
const bookController = require('../controllers/bookController');
const authController = require('../controllers/authController');

const router = express.Router();

// Allow everyone (even unauthenticated) to see books
router.route('/')
  .get(bookController.getAllBooks)
  .post(authController.protect, authController.restrictTo('librarian'), bookController.createBook);

router.route('/:id')
  .get(bookController.getBook)
  .patch(authController.protect, authController.restrictTo('librarian'), bookController.updateBook)
  .delete(authController.protect, authController.restrictTo('librarian'), bookController.deleteBook);

module.exports = router;
