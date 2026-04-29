const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, restrictTo } = require('../controllers/authController');

// All report routes are protected and restricted to librarian/admin staff only
router.use(protect);
router.use(restrictTo('librarian'));

router.get('/most-borrowed', reportController.getMostBorrowedBooks);
router.get('/user-activity', reportController.getUserActivity);
router.get('/fines', reportController.getFineCollection);
router.get('/usage', reportController.getUsageStatistics);

module.exports = router;
