const express = require('express');
const transactionController = require('../controllers/transactionController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect); // All routes below are protected

router.post('/borrow', transactionController.borrowBook);
router.post('/reserve', transactionController.reserveBook);
router.post('/return', transactionController.returnBook);
router.get('/my-history', transactionController.getMyHistory);
router.post('/:id/submit-payment', transactionController.submitPayment);

// Librarian only routes
router.use(authController.restrictTo('librarian'));
router.get('/', transactionController.getAllTransactions);
router.put('/:id/pay-fine', transactionController.payFine);

module.exports = router;
