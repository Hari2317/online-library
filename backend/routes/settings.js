const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { protect, restrictTo } = require('../controllers/authController');

router.get('/:key', settingController.getSetting);

router.post('/:key', protect, restrictTo('librarian'), settingController.updateSetting);

module.exports = router;
